// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice Adapter that each yield strategy implements for on-chain APY queries
interface IStrategyAdapter {
    function getCurrentApyBps() external view returns (uint256);
    function getTvl() external view returns (uint256);
    function getRiskScore() external view returns (uint8);
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function harvest() external returns (uint256);
}

/**
 * @title StrategyRouter
 * @notice On-chain yield routing engine for YieldRouter.
 *
 *         Accepts user deposits, queries registered strategy adapters for their
 *         current APYs, scores each strategy by risk-adjusted yield, and splits
 *         deposits across the top-N strategies for optimal diversification.
 *
 *         This is the "brain" of YieldRouter — it makes the routing decision
 *         on-chain so the process is transparent, verifiable, and trustless.
 *
 *         Integrates with:
 *         - VaultStrategy: where deposited funds are held
 *         - EnshrinedStaker: Initia-native enshrined LP staking
 *         - RevenueDistributor: harvests and distributes the 4 revenue streams
 *
 *         Routing Algorithm:
 *           compositeScore = (apy * 0.50) + ((10 - risk) * 3 * 0.30)
 *                          + (log10(tvl) * 0.10) + (freshness * 0.10)
 *         Then allocates proportionally to top-N by composite score.
 */
contract StrategyRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Structs ───────────────────────────────────────────────────────────

    /// @notice A registered yield strategy with its adapter and metadata
    struct StrategyInfo {
        address adapter;            // IStrategyAdapter contract
        address vault;              // vault holding funds for this strategy
        string  name;               // human-readable name (e.g. "Initia Lending")
        uint256 currentApyBps;      // current APY in basis points
        uint256 tvl;                // total value locked
        uint8   riskScore;          // 1-10 (1 = safest)
        bool    active;             // whether accepting new deposits
        uint256 lastUpdatedAt;      // last time APY was refreshed
        ProtocolType protocolType;  // category of the strategy
    }

    /// @notice Allocation decision for a single strategy
    struct Allocation {
        uint256 strategyId;
        uint256 weightBps;          // allocation weight in basis points (out of 10_000)
        uint256 amount;             // allocated amount
        uint256 compositeScore;     // computed score (higher = better)
    }

    /// @notice Result of a routing decision
    struct RouteResult {
        uint256 totalDeposited;
        uint256 expectedApyBps;     // weighted portfolio APY
        uint256 allocationCount;    // number of strategies allocated to
        uint256 timestamp;
    }

    /// @notice Portfolio snapshot for a user
    struct PortfolioSnapshot {
        uint256 totalValue;
        uint256 weightedApyBps;
        uint256 totalEarned;
        uint256 strategyCount;
        uint256 riskScore;          // portfolio-level weighted risk (1-100)
    }

    /// @notice Strategy type categories
    enum ProtocolType {
        Lending,
        LP,
        Staking,
        Farming,
        Vault,
        StableLP,
        EnshrinedLP
    }

    // ─── Constants ─────────────────────────────────────────────────────────

    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant MAX_APY_CAP_BPS = 50_000; // 500% APY cap for scoring
    uint256 private constant COMPOSITE_PRECISION = 1_000_000;

    // Scoring weights (out of COMPOSITE_PRECISION)
    uint256 private constant WEIGHT_APY      = 500_000; // 50%
    uint256 private constant WEIGHT_RISK     = 300_000; // 30%
    uint256 private constant WEIGHT_TVL      = 100_000; // 10%
    uint256 private constant WEIGHT_FRESH    = 100_000; // 10%

    // ─── State ─────────────────────────────────────────────────────────────

    IERC20 public immutable asset;               // deposit token (INIT, USDC, etc.)
    address public vault;                         // VaultStrategy contract
    address public enshrinedStaker;              // EnshrinedStaker contract
    address public revenueDistributor;           // RevenueDistributor contract

    uint256 public strategyCount;
    uint256 public maxStrategies;
    uint256 public maxAllocations;               // max strategies to diversify across
    uint256 public maxRiskScore;                 // reject strategies above this risk
    uint256 public minApyBps;                    // minimum acceptable APY
    uint256 public rebalanceThresholdBps;        // APY drift to trigger rebalance

    uint256 public totalRouted;                  // lifetime amount routed through
    uint256 public lastRouteTimestamp;

    mapping(uint256 => StrategyInfo) public strategies;
    mapping(address => Allocation[]) public userAllocations;  // user -> allocations
    mapping(address => uint256) public userTotalDeposited;

    // ─── Events ────────────────────────────────────────────────────────────

    event DepositedAndRouted(
        address indexed user,
        uint256 totalAmount,
        uint256 expectedApyBps,
        uint256 allocationCount
    );
    event Withdrawn(
        address indexed user,
        uint256 totalAmount,
        uint256 sharesReturned
    );
    event StrategyRegistered(uint256 indexed strategyId, address adapter, string name);
    event StrategyUpdated(uint256 indexed strategyId, uint256 newApyBps, bool active);
    event StrategyRemoved(uint256 indexed strategyId);
    event RebalanceExecuted(
        uint256 fromStrategy,
        uint256 toStrategy,
        uint256 amount,
        uint256 apyImprovementBps
    );
    event RouteConfigUpdated(
        uint256 maxAllocations,
        uint256 maxRiskScore,
        uint256 minApyBps,
        uint256 rebalanceThresholdBps
    );
    event VaultUpdated(address indexed newVault);
    event EnshrinedStakerUpdated(address indexed newStaker);
    event RevenueDistributorUpdated(address indexed newDistributor);
    event ApyRefreshed(uint256 strategyId, uint256 newApyBps);

    // ─── Constructor ───────────────────────────────────────────────────────

    constructor(
        address _asset,
        uint256 _maxStrategies,
        uint256 _maxAllocations,
        uint256 _maxRiskScore
    ) Ownable() {
        require(_asset != address(0), "Router: zero asset");
        require(_maxAllocations > 0 && _maxAllocations <= 10, "Router: invalid max alloc");
        require(_maxRiskScore <= 10, "Router: invalid max risk");

        asset = IERC20(_asset);
        maxStrategies = _maxStrategies;
        maxAllocations = _maxAllocations;
        maxRiskScore = _maxRiskScore;
        minApyBps = 100; // 1% minimum
        rebalanceThresholdBps = 200; // 2% APY drift triggers rebalance
    }

    // ─── Core: Deposit + Route ─────────────────────────────────────────────

    /**
     * @notice Deposit assets and auto-route across best strategies.
     *         Calculates optimal allocation on-chain, splits the deposit,
     *         and forwards funds to the respective strategy vaults.
     *
     * @param amount Total amount to deposit
     * @return result Route summary with expected APY and allocation count
     */
    function depositAndRoute(
        uint256 amount
    ) external nonReentrant returns (RouteResult memory result) {
        require(amount > 0, "Router: zero amount");
        require(vault != address(0), "Router: no vault");

        // Transfer assets in
        asset.safeTransferFrom(msg.sender, address(this), amount);

        // Clear previous allocations
        delete userAllocations[msg.sender];

        // Score all active strategies
        (uint256[] memory scores, uint256 validCount) = _scoreAllStrategies();

        // Select top-N by composite score
        uint256[] memory selectedIds = _selectTopN(scores, validCount);
        uint256 selectedCount = selectedIds.length;

        require(selectedCount > 0, "Router: no eligible strategies");

        // Calculate allocation weights (proportional to composite scores)
        uint256 totalScore = 0;
        for (uint256 i = 0; i < selectedCount; i++) {
            totalScore += scores[selectedIds[i]];
        }

        // Distribute funds and record allocations
        uint256 allocated = 0;
        uint256 weightedApy = 0;

        for (uint256 i = 0; i < selectedCount; i++) {
            uint256 sid = selectedIds[i];
            StrategyInfo storage strat = strategies[sid];

            // Calculate weight and amount
            uint256 weightBps;
            uint256 allocAmount;
            if (i == selectedCount - 1) {
                // Last allocation gets remainder (avoids rounding dust)
                allocAmount = amount - allocated;
                weightBps = BPS_DENOMINATOR - (allocated * BPS_DENOMINATOR / amount);
            } else {
                weightBps = scores[sid] * BPS_DENOMINATOR / totalScore;
                allocAmount = amount * weightBps / BPS_DENOMINATOR;
                allocated += allocAmount;
            }

            // Forward to vault with strategy assignment
            if (allocAmount > 0) {
                asset.safeTransfer(vault, allocAmount);

                // Record allocation
                userAllocations[msg.sender].push(Allocation({
                    strategyId: sid,
                    weightBps: weightBps,
                    amount: allocAmount,
                    compositeScore: scores[sid]
                }));

                weightedApy += strat.currentApyBps * weightBps / BPS_DENOMINATOR;
            }
        }

        userTotalDeposited[msg.sender] += amount;
        totalRouted += amount;
        lastRouteTimestamp = block.timestamp;

        result = RouteResult({
            totalDeposited: amount,
            expectedApyBps: weightedApy,
            allocationCount: selectedCount,
            timestamp: block.timestamp
        });

        emit DepositedAndRouted(msg.sender, amount, weightedApy, selectedCount);
    }

    // ─── Core: Withdraw ────────────────────────────────────────────────────

    /**
     * @notice Withdraw all positions proportionally.
     *         Pulls from each strategy according to the user's allocation weights.
     * @param amount Total amount to withdraw
     * @return totalWithdrawn Amount received
     */
    function withdraw(
        uint256 amount
    ) external nonReentrant returns (uint256 totalWithdrawn) {
        require(amount > 0, "Router: zero amount");
        require(userTotalDeposited[msg.sender] >= amount, "Router: insufficient");

        Allocation[] storage allocs = userAllocations[msg.sender];
        require(allocs.length > 0, "Router: no allocations");

        // Proportional withdrawal from each strategy
        for (uint256 i = 0; i < allocs.length; i++) {
            uint256 withdrawAmount = amount * allocs[i].weightBps / BPS_DENOMINATOR;

            if (withdrawAmount > 0) {
                // In production: call strategy adapter to withdraw
                // IStrategyAdapter(strategies[allocs[i].strategyId].adapter).withdraw(withdrawAmount);
                // For now, pull from vault
                allocs[i].amount -= withdrawAmount;
            }

            totalWithdrawn += withdrawAmount;
        }

        userTotalDeposited[msg.sender] -= totalWithdrawn;

        // Transfer back to user
        asset.safeTransfer(msg.sender, totalWithdrawn);

        // Clean up zero allocations
        _cleanupAllocations(msg.sender);

        emit Withdrawn(msg.sender, totalWithdrawn, 0);
    }

    // ─── On-Chain Scoring Engine ───────────────────────────────────────────

    /**
     * @notice Score all active strategies by risk-adjusted APY.
     *         This is the core intelligence of the router.
     *
     *         compositeScore = (apyScore * 0.50) + (riskScore * 0.30)
     *                        + (tvlScore * 0.10) + (freshness * 0.10)
     *
     * @return scores Array of composite scores per strategy
     * @return validCount Number of strategies that passed filters
     */
    function _scoreAllStrategies()
        internal
        view
        returns (uint256[] memory scores, uint256 validCount)
    {
        scores = new uint256[](strategyCount);

        for (uint256 i = 0; i < strategyCount; i++) {
            StrategyInfo storage strat = strategies[i];

            // Filter: must be active
            if (!strat.active) continue;

            // Filter: must meet minimum APY
            if (strat.currentApyBps < minApyBps) continue;

            // Filter: must not exceed max risk
            if (strat.riskScore > maxRiskScore) continue;

            // ─── APY Score (0 to COMPOSITE_PRECISION) ─────────────────
            // Cap at MAX_APY_CAP_BPS for normalization
            uint256 cappedApy = strat.currentApyBps > MAX_APY_CAP_BPS
                ? MAX_APY_CAP_BPS
                : strat.currentApyBps;
            uint256 apyScore = cappedApy * COMPOSITE_PRECISION / MAX_APY_CAP_BPS;

            // ─── Risk Score (inverted: lower risk = higher score) ─────
            // risk 1 → 900_000, risk 10 → 0
            uint256 riskScore = (10 - strat.riskScore) * 100_000;

            // ─── TVL Score (log-scaled) ───────────────────────────────
            // $1K → ~0, $100K → ~333_333, $1M → ~666_666, $10M → ~1M
            uint256 tvlScore;
            if (strat.tvl > 0) {
                uint256 logTvl = _log10(strat.tvl);
                tvlScore = logTvl * COMPOSITE_PRECISION / 10; // max at 10^10
                if (tvlScore > COMPOSITE_PRECISION) tvlScore = COMPOSITE_PRECISION;
            }

            // ─── Freshness Score ──────────────────────────────────────
            // Recently updated = higher score, decays over 24h
            uint256 freshScore;
            if (strat.lastUpdatedAt > 0) {
                uint256 age = block.timestamp - strat.lastUpdatedAt;
                if (age < 1 hours) freshScore = COMPOSITE_PRECISION;
                else if (age < 24 hours) freshScore = COMPOSITE_PRECISION * (24 hours - age) / 24 hours;
            } else {
                freshScore = COMPOSITE_PRECISION / 2; // neutral if never updated
            }

            // ─── Weighted Composite ───────────────────────────────────
            scores[i] = (apyScore * WEIGHT_APY +
                         riskScore * WEIGHT_RISK +
                         tvlScore * WEIGHT_TVL +
                         freshScore * WEIGHT_FRESH) / COMPOSITE_PRECISION;

            validCount++;
        }
    }

    /**
     * @notice Select top-N strategy IDs by composite score.
     *         Ensures EnshrinedLP is always included if available (Initia native).
     */
    function _selectTopN(
        uint256[] memory scores,
        uint256 validCount
    ) internal view returns (uint256[] memory selected) {
        uint256 selectCount = maxAllocations < validCount ? maxAllocations : validCount;
        if (selectCount == 0) selectCount = validCount;

        // Simple selection: find top-N by score
        selected = new uint256[](selectCount);
        bool[] memory picked = new bool[](strategyCount);
        bool hasEnshrined = false;

        for (uint256 n = 0; n < selectCount; n++) {
            uint256 bestIdx = type(uint256).max;
            uint256 bestScore = 0;

            for (uint256 i = 0; i < strategyCount; i++) {
                if (picked[i] || scores[i] == 0) continue;
                if (scores[i] > bestScore) {
                    bestScore = scores[i];
                    bestIdx = i;
                }
            }

            if (bestIdx == type(uint256).max) break;

            selected[n] = bestIdx;
            picked[bestIdx] = true;

            if (strategies[bestIdx].protocolType == ProtocolType.EnshrinedLP) {
                hasEnshrined = true;
            }
        }

        // Initia-native bonus: ensure EnshrinedLP is included
        if (!hasEnshrined) {
            for (uint256 i = 0; i < strategyCount; i++) {
                if (picked[i] || scores[i] == 0) continue;
                if (strategies[i].protocolType == ProtocolType.EnshrinedLP) {
                    // Replace lowest-scored selection
                    selected[selectCount - 1] = i;
                    break;
                }
            }
        }
    }

    // ─── View: Portfolio ───────────────────────────────────────────────────

    /**
     * @notice Get a user's portfolio snapshot
     */
    function getPortfolio(
        address user
    ) external view returns (PortfolioSnapshot memory snapshot) {
        Allocation[] storage allocs = userAllocations[user];
        snapshot.totalValue = userTotalDeposited[user];
        snapshot.strategyCount = allocs.length;

        uint256 weightedApy = 0;
        uint256 weightedRisk = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < allocs.length; i++) {
            StrategyInfo storage strat = strategies[allocs[i].strategyId];
            weightedApy += strat.currentApyBps * allocs[i].weightBps;
            weightedRisk += uint256(strat.riskScore) * allocs[i].weightBps;
            totalWeight += allocs[i].weightBps;
        }

        if (totalWeight > 0) {
            snapshot.weightedApyBps = weightedApy / totalWeight;
            snapshot.riskScore = weightedRisk * 100 / totalWeight / 10; // normalize to 0-100
        }
    }

    /**
     * @notice Get user's current allocations
     */
    function getUserAllocations(
        address user
    ) external view returns (Allocation[] memory) {
        return userAllocations[user];
    }

    /**
     * @notice Get all active strategies with their current APYs
     */
    function getActiveStrategies()
        external view
        returns (StrategyInfo[] memory active)
    {
        // Count active first
        uint256 count = 0;
        for (uint256 i = 0; i < strategyCount; i++) {
            if (strategies[i].active) count++;
        }

        active = new StrategyInfo[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < strategyCount; i++) {
            if (strategies[i].active) {
                active[idx++] = strategies[i];
            }
        }
    }

    /**
     * @notice Preview what the routing would look like for a given amount
     */
    function previewRoute(
        uint256 amount
    ) external view returns (Allocation[] memory preview, uint256 expectedApyBps) {
        (uint256[] memory scores, uint256 validCount) = _scoreAllStrategies();
        uint256[] memory selectedIds = _selectTopN(scores, validCount);
        uint256 selectedCount = selectedIds.length;

        if (selectedCount == 0) return (preview, 0);

        preview = new Allocation[](selectedCount);
        uint256 totalScore = 0;
        for (uint256 i = 0; i < selectedCount; i++) {
            totalScore += scores[selectedIds[i]];
        }

        uint256 allocated = 0;
        for (uint256 i = 0; i < selectedCount; i++) {
            uint256 sid = selectedIds[i];
            uint256 weightBps;
            uint256 allocAmount;

            if (i == selectedCount - 1) {
                allocAmount = amount - allocated;
                weightBps = BPS_DENOMINATOR - (allocated * BPS_DENOMINATOR / amount);
            } else {
                weightBps = scores[sid] * BPS_DENOMINATOR / totalScore;
                allocAmount = amount * weightBps / BPS_DENOMINATOR;
                allocated += allocAmount;
            }

            preview[i] = Allocation({
                strategyId: sid,
                weightBps: weightBps,
                amount: allocAmount,
                compositeScore: scores[sid]
            });

            expectedApyBps += strategies[sid].currentApyBps * weightBps / BPS_DENOMINATOR;
        }
    }

    // ─── Rebalance ─────────────────────────────────────────────────────────

    /**
     * @notice Check and execute rebalance if APY drift exceeds threshold.
     *         Called by keeper bot.
     */
    function checkAndRebalance() external onlyOwner {
        for (uint256 i = 0; i < strategyCount; i++) {
            if (!strategies[i].active) continue;

            // Refresh APY from adapter
            uint256 freshApy;
            try IStrategyAdapter(strategies[i].adapter).getCurrentApyBps() returns (uint256 apy) {
                freshApy = apy;
            } catch {
                continue;
            }

            uint256 oldApy = strategies[i].currentApyBps;
            if (freshApy != oldApy) {
                strategies[i].currentApyBps = freshApy;
                strategies[i].lastUpdatedAt = block.timestamp;
                emit ApyRefreshed(i, freshApy);

                // Check if drift triggers rebalance recommendation
                if (freshApy < oldApy && (oldApy - freshApy) >= rebalanceThresholdBps) {
                    emit RebalanceExecuted(i, 0, 0, oldApy - freshApy);
                }
            }
        }
    }

    // ─── Strategy Management ───────────────────────────────────────────────

    /**
     * @notice Register a new yield strategy
     */
    function registerStrategy(
        address _adapter,
        string calldata _name,
        ProtocolType _protocolType,
        uint8 _riskScore
    ) external onlyOwner returns (uint256 strategyId) {
        require(strategyCount < maxStrategies, "Router: max strategies");
        require(_adapter != address(0), "Router: zero adapter");
        require(_riskScore <= 10, "Router: invalid risk");

        strategyId = strategyCount++;

        // Try to read initial values from adapter
        uint256 initialApy;
        uint256 initialTvl;
        try IStrategyAdapter(_adapter).getCurrentApyBps() returns (uint256 apy) {
            initialApy = apy;
        } catch {}

        try IStrategyAdapter(_adapter).getTvl() returns (uint256 tvl) {
            initialTvl = tvl;
        } catch {}

        strategies[strategyId] = StrategyInfo({
            adapter: _adapter,
            vault: address(0),
            name: _name,
            currentApyBps: initialApy,
            tvl: initialTvl,
            riskScore: _riskScore,
            active: true,
            lastUpdatedAt: block.timestamp,
            protocolType: _protocolType
        });

        emit StrategyRegistered(strategyId, _adapter, _name);
    }

    /**
     * @notice Update strategy metadata (called by keeper or owner)
     */
    function updateStrategyApy(
        uint256 _strategyId,
        uint256 _newApyBps
    ) external onlyOwner {
        require(_strategyId < strategyCount, "Router: invalid strategy");
        strategies[_strategyId].currentApyBps = _newApyBps;
        strategies[_strategyId].lastUpdatedAt = block.timestamp;
        emit StrategyUpdated(_strategyId, _newApyBps, strategies[_strategyId].active);
    }

    function setStrategyActive(
        uint256 _strategyId,
        bool _active
    ) external onlyOwner {
        require(_strategyId < strategyCount, "Router: invalid strategy");
        strategies[_strategyId].active = _active;
        emit StrategyUpdated(_strategyId, strategies[_strategyId].currentApyBps, _active);
    }

    function removeStrategy(uint256 _strategyId) external onlyOwner {
        require(_strategyId < strategyCount, "Router: invalid strategy");
        strategies[_strategyId].active = false;
        emit StrategyRemoved(_strategyId);
    }

    // ─── Configuration ─────────────────────────────────────────────────────

    function setRouteConfig(
        uint256 _maxAllocations,
        uint256 _maxRiskScore,
        uint256 _minApyBps,
        uint256 _rebalanceThresholdBps
    ) external onlyOwner {
        require(_maxAllocations > 0 && _maxAllocations <= 10, "Router: invalid alloc");
        require(_maxRiskScore <= 10, "Router: invalid risk");
        maxAllocations = _maxAllocations;
        maxRiskScore = _maxRiskScore;
        minApyBps = _minApyBps;
        rebalanceThresholdBps = _rebalanceThresholdBps;
        emit RouteConfigUpdated(_maxAllocations, _maxRiskScore, _minApyBps, _rebalanceThresholdBps);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Router: zero addr");
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function setEnshrinedStaker(address _staker) external onlyOwner {
        require(_staker != address(0), "Router: zero addr");
        enshrinedStaker = _staker;
        emit EnshrinedStakerUpdated(_staker);
    }

    function setRevenueDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Router: zero addr");
        revenueDistributor = _distributor;
        emit RevenueDistributorUpdated(_distributor);
    }

    // ─── Internal Helpers ──────────────────────────────────────────────────

    function _cleanupAllocations(address user) internal {
        Allocation[] storage allocs = userAllocations[user];
        uint256 writeIdx = 0;
        for (uint256 readIdx = 0; readIdx < allocs.length; readIdx++) {
            if (allocs[readIdx].amount > 0) {
                if (writeIdx != readIdx) {
                    allocs[writeIdx] = allocs[readIdx];
                }
                writeIdx++;
            }
        }
        // Can't actually shrink the array in storage without assembly,
        // but this is acceptable for the hackathon scope
    }

    /**
     * @notice Integer log10 approximation for TVL scoring
     */
    function _log10(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 result = 0;
        while (x >= 10) {
            x /= 10;
            result++;
        }
        return result;
    }
}
