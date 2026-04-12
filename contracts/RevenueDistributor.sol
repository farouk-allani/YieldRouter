// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RevenueDistributor
 * @notice Harvests revenue from 4 streams and distributes to vault depositors:
 *         1. Vault yield (best strategy across Initia via Bridge)
 *         2. Staking rewards (Enshrined Liquidity — LP positions stake with validators)
 *         3. LP trading fees
 *         4. Revenue share (appchain tx fees recycled to users)
 *
 *         Revenue is harvested periodically by a keeper, then distributed
 *         proportionally to vault shareholders via VaultStrategy.reportRevenue().
 */
contract RevenueDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Structs ───────────────────────────────────────────────────────────

    struct RevenueSource {
        address adapter;          // adapter contract that harvests this revenue stream
        uint256 lastHarvestedAt;  // timestamp of last harvest
        uint256 totalHarvested;   // lifetime harvested amount
        bool    active;
    }

    struct HarvestResult {
        uint256 vaultYield;
        uint256 stakingRewards;
        uint256 lpFees;
        uint256 revenueShare;
        uint256 totalRevenue;
    }

    // ─── Revenue Stream IDs ────────────────────────────────────────────────

    uint256 public constant STREAM_VAULT_YIELD    = 0;
    uint256 public constant STREAM_STAKING        = 1;
    uint256 public constant STREAM_LP_FEES        = 2;
    uint256 public constant STREAM_REVENUE_SHARE  = 3;
    uint256 public constant STREAM_COUNT           = 4;

    // ─── State ─────────────────────────────────────────────────────────────

    IERC20 public immutable asset;
    address public vault;                       // VaultStrategy contract
    uint256 public harvestInterval;             // minimum seconds between harvests
    uint256 public lastHarvestTimestamp;
    uint256 public totalDistributed;            // total revenue distributed to vault
    uint256 public performanceFeeBps;           // keeper/performance fee
    address public keeper;                      // authorized keeper bot

    mapping(uint256 => RevenueSource) public sources;
    mapping(uint256 => uint256) public cumulativeStreamRevenue;

    // ─── Events ────────────────────────────────────────────────────────────

    event Harvested(
        uint256 indexed epoch,
        uint256 vaultYield,
        uint256 stakingRewards,
        uint256 lpFees,
        uint256 revenueShare,
        uint256 totalRevenue
    );
    event SourceRegistered(uint256 indexed streamId, address adapter);
    event SourceUpdated(uint256 indexed streamId, bool active);
    event VaultUpdated(address indexed newVault);
    event HarvestIntervalUpdated(uint256 newInterval);
    event KeeperUpdated(address indexed newKeeper);
    event FeesCollected(address indexed treasury, uint256 amount);

    // ─── Modifiers ─────────────────────────────────────────────────────────

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Distributor: not keeper");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────

    constructor(
        address _asset,
        uint256 _harvestInterval,
        uint256 _performanceFeeBps
    ) Ownable() {
        require(_asset != address(0), "Distributor: zero asset");
        require(_performanceFeeBps <= 1000, "Distributor: fee too high"); // max 10%
        asset = IERC20(_asset);
        harvestInterval = _harvestInterval;
        performanceFeeBps = _performanceFeeBps;
    }

    // ─── Harvest ───────────────────────────────────────────────────────────

    /**
     * @notice Harvest revenue from all 4 streams and forward to vault.
     *         Each stream adapter must implement IRevenueAdapter.harvest().
     *         The keeper calls this periodically.
     * @return result Breakdown of harvested revenue by stream
     */
    function harvest() external onlyKeeper nonReentrant returns (HarvestResult memory result) {
        require(vault != address(0), "Distributor: no vault");
        require(
            block.timestamp >= lastHarvestTimestamp + harvestInterval,
            "Distributor: too early"
        );

        lastHarvestTimestamp = block.timestamp;

        // Harvest each active stream
        for (uint256 i = 0; i < STREAM_COUNT; i++) {
            RevenueSource storage source = sources[i];
            if (!source.active || source.adapter == address(0)) continue;

            uint256 amount = IRevenueAdapter(source.adapter).harvest();
            source.totalHarvested += amount;
            source.lastHarvestedAt = block.timestamp;

            if (i == STREAM_VAULT_YIELD)      result.vaultYield      += amount;
            else if (i == STREAM_STAKING)     result.stakingRewards  += amount;
            else if (i == STREAM_LP_FEES)     result.lpFees          += amount;
            else if (i == STREAM_REVENUE_SHARE) result.revenueShare  += amount;
        }

        result.totalRevenue = result.vaultYield + result.stakingRewards +
                              result.lpFees + result.revenueShare;

        require(result.totalRevenue > 0, "Distributor: no revenue");

        // Take performance fee
        uint256 fee = 0;
        if (performanceFeeBps > 0) {
            fee = (result.totalRevenue * performanceFeeBps) / 10_000;
            if (fee > 0) {
                asset.safeTransfer(owner(), fee);
                emit FeesCollected(owner(), fee);
            }
        }

        uint256 netRevenue = result.totalRevenue - fee;

        // Update cumulative tracking
        cumulativeStreamRevenue[STREAM_VAULT_YIELD]     += result.vaultYield;
        cumulativeStreamRevenue[STREAM_STAKING]         += result.stakingRewards;
        cumulativeStreamRevenue[STREAM_LP_FEES]         += result.lpFees;
        cumulativeStreamRevenue[STREAM_REVENUE_SHARE]   += result.revenueShare;
        totalDistributed += netRevenue;

        // Transfer net revenue to vault and report
        if (netRevenue > 0) {
            asset.safeTransfer(vault, netRevenue);
            IVaultStrategy(vault).reportRevenue(
                result.vaultYield,
                result.stakingRewards,
                result.lpFees,
                result.revenueShare
            );
        }

        emit Harvested(
            block.timestamp,
            result.vaultYield,
            result.stakingRewards,
            result.lpFees,
            result.revenueShare,
            result.totalRevenue
        );
    }

    /**
     * @notice Get total lifetime revenue across all streams
     */
    function getTotalLifetimeRevenue() external view returns (uint256 total) {
        for (uint256 i = 0; i < STREAM_COUNT; i++) {
            total += sources[i].totalHarvested;
        }
    }

    /**
     * @notice Get revenue breakdown by stream
     */
    function getRevenueBreakdown() external view returns (
        uint256[4] memory streamTotals,
        uint256 grandTotal
    ) {
        for (uint256 i = 0; i < STREAM_COUNT; i++) {
            streamTotals[i] = sources[i].totalHarvested;
            grandTotal += sources[i].totalHarvested;
        }
    }

    // ─── Source Management ─────────────────────────────────────────────────

    /**
     * @notice Register a revenue source adapter
     */
    function registerSource(
        uint256 _streamId,
        address _adapter
    ) external onlyOwner {
        require(_streamId < STREAM_COUNT, "Distributor: invalid stream");
        require(_adapter != address(0), "Distributor: zero adapter");
        sources[_streamId] = RevenueSource({
            adapter: _adapter,
            lastHarvestedAt: 0,
            totalHarvested: 0,
            active: true
        });
        emit SourceRegistered(_streamId, _adapter);
    }

    function updateSource(uint256 _streamId, bool _active) external onlyOwner {
        require(_streamId < STREAM_COUNT, "Distributor: invalid stream");
        sources[_streamId].active = _active;
        emit SourceUpdated(_streamId, _active);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Distributor: zero vault");
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function setHarvestInterval(uint256 _interval) external onlyOwner {
        harvestInterval = _interval;
        emit HarvestIntervalUpdated(_interval);
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }
}

// ─── Interfaces ────────────────────────────────────────────────────────────

interface IRevenueAdapter {
    /**
     * @notice Harvest revenue from this stream and transfer to caller.
     * @return amount Amount of revenue harvested
     */
    function harvest() external returns (uint256 amount);
}

interface IVaultStrategy {
    function reportRevenue(
        uint256 vaultYield,
        uint256 stakingRewards,
        uint256 lpFees,
        uint256 revenueShare
    ) external;
}
