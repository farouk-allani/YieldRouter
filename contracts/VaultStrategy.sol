// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VaultStrategy
 * @notice Core vault for YieldRouter — accepts user deposits, routes to best
 *         yield strategy across Initia, and tracks shares for fair distribution.
 *         One deposit, four revenue streams: vault yield, staking rewards,
 *         LP trading fees, and chain revenue share.
 */
contract VaultStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Structs ───────────────────────────────────────────────────────────

    struct Strategy {
        address adapter;          // protocol adapter contract
        uint256 totalDeposited;   // total assets in this strategy
        uint256 apyBps;           // current APY in basis points (e.g. 2480 = 24.80%)
        bool    active;           // whether strategy accepts new deposits
        uint8   riskScore;        // 1-10 risk score
    }

    struct UserPosition {
        uint256 shares;           // vault shares owned
        uint256 depositedAt;      // timestamp of last deposit
        uint256 strategyId;       // assigned strategy index
    }

    struct RevenueBreakdown {
        uint256 vaultYield;       // yield from lending/farming strategies
        uint256 stakingRewards;   // enshrined liquidity staking rewards
        uint256 lpFees;           // LP trading fee revenue
        uint256 revenueShare;     // Initia appchain tx fee revenue share
    }

    // ─── State ─────────────────────────────────────────────────────────────

    IERC20 public immutable asset;               // deposit token (e.g. INIT, USDC)
    uint256 public totalAssets;                   // total assets under management
    uint256 public totalShares;                   // total vault shares outstanding
    uint256 public strategyCount;                 // number of registered strategies
    uint256 public maxStrategies;                 // max strategies to diversify across
    uint256 public performanceFeeBps;             // performance fee (basis points)
    address public revenueDistributor;            // RevenueDistributor contract

    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant SHARE_PRECISION = 1e18;

    mapping(uint256 => Strategy) public strategies;
    mapping(address => UserPosition) public positions;

    RevenueBreakdown public cumulativeRevenue;

    // ─── Events ────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 assets, uint256 shares, uint256 strategyId);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event StrategyAdded(uint256 indexed strategyId, address adapter, uint256 apyBps);
    event StrategyUpdated(uint256 indexed strategyId, uint256 newApyBps, bool active);
    event Rebalanced(uint256 fromStrategy, uint256 toStrategy, uint256 amount);
    event RevenueCollected(uint256 vaultYield, uint256 stakingRewards, uint256 lpFees, uint256 revenueShare);
    event RevenueDistributorUpdated(address indexed newDistributor);

    // ─── Modifiers ─────────────────────────────────────────────────────────

    modifier onlyRevenueDistributor() {
        require(msg.sender == revenueDistributor, "Vault: only distributor");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────

    constructor(
        address _asset,
        uint256 _maxStrategies,
        uint256 _performanceFeeBps
    ) Ownable(msg.sender) {
        require(_asset != address(0), "Vault: zero asset");
        require(_performanceFeeBps <= 2000, "Vault: fee too high"); // max 20%
        asset = IERC20(_asset);
        maxStrategies = _maxStrategies;
        performanceFeeBps = _performanceFeeBps;
    }

    // ─── View ──────────────────────────────────────────────────────────────

    /**
     * @notice Convert assets to shares at current exchange rate
     */
    function convertToShares(uint256 assets) public view returns (uint256) {
        if (totalAssets == 0) return assets * SHARE_PRECISION;
        return (assets * totalShares) / totalAssets;
    }

    /**
     * @notice Convert shares to assets at current exchange rate
     */
    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (totalShares == 0) return shares / SHARE_PRECISION;
        return (shares * totalAssets) / totalShares;
    }

    /**
     * @notice Get the best active strategy by APY
     */
    function getBestStrategy() public view returns (uint256 bestId, uint256 bestApy) {
        bestApy = 0;
        for (uint256 i = 0; i < strategyCount; i++) {
            if (strategies[i].active && strategies[i].apyBps > bestApy) {
                bestApy = strategies[i].apyBps;
                bestId = i;
            }
        }
    }

    /**
     * @notice Get user's current position value in assets
     */
    function getPositionValue(address user) external view returns (uint256) {
        return convertToAssets(positions[user].shares);
    }

    // ─── Core: Deposit ─────────────────────────────────────────────────────

    /**
     * @notice Deposit assets into the vault. Automatically routes to best strategy.
     * @param assets Amount of underlying asset to deposit
     * @return shares Vault shares minted to the user
     */
    function deposit(uint256 assets) external nonReentrant returns (uint256 shares) {
        require(assets > 0, "Vault: zero deposit");

        // Pick best strategy
        (uint256 strategyId, ) = getBestStrategy();
        require(strategies[strategyId].active, "Vault: no active strategy");

        // Transfer assets in
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Calculate shares
        shares = convertToShares(assets);
        require(shares > 0, "Vault: zero shares");

        // Update state
        totalAssets += assets;
        totalShares += shares;

        UserPosition storage pos = positions[msg.sender];
        pos.shares += shares;
        pos.depositedAt = block.timestamp;
        pos.strategyId = strategyId;

        strategies[strategyId].totalDeposited += assets;

        emit Deposited(msg.sender, assets, shares, strategyId);
    }

    // ─── Core: Withdraw ────────────────────────────────────────────────────

    /**
     * @notice Withdraw assets by burning vault shares
     * @param shares Amount of shares to burn
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Vault: zero shares");

        UserPosition storage pos = positions[msg.sender];
        require(pos.shares >= shares, "Vault: insufficient shares");

        uint256 assets = convertToAssets(shares);

        // Update state
        pos.shares -= shares;
        totalShares -= shares;
        totalAssets -= assets;

        // Reduce strategy allocation
        if (strategies[pos.strategyId].totalDeposited >= assets) {
            strategies[pos.strategyId].totalDeposited -= assets;
        }

        // Transfer assets out
        asset.safeTransfer(msg.sender, assets);

        emit Withdrawn(msg.sender, assets, shares);
    }

    // ─── Strategy Management ───────────────────────────────────────────────

    /**
     * @notice Register a new yield strategy
     */
    function addStrategy(
        address _adapter,
        uint256 _apyBps,
        uint8 _riskScore
    ) external onlyOwner returns (uint256 strategyId) {
        require(strategyCount < maxStrategies, "Vault: max strategies");
        require(_adapter != address(0), "Vault: zero adapter");
        require(_riskScore <= 10, "Vault: invalid risk");

        strategyId = strategyCount++;
        strategies[strategyId] = Strategy({
            adapter: _adapter,
            totalDeposited: 0,
            apyBps: _apyBps,
            active: true,
            riskScore: _riskScore
        });

        emit StrategyAdded(strategyId, _adapter, _apyBps);
    }

    /**
     * @notice Update strategy APY (called by oracle/keeper)
     */
    function updateStrategy(uint256 _strategyId, uint256 _newApyBps, bool _active) external onlyOwner {
        require(_strategyId < strategyCount, "Vault: invalid strategy");
        strategies[_strategyId].apyBps = _newApyBps;
        strategies[_strategyId].active = _active;
        emit StrategyUpdated(_strategyId, _newApyBps, _active);
    }

    // ─── Rebalancing ───────────────────────────────────────────────────────

    /**
     * @notice Rebalance funds from one strategy to a better one.
     *         Only owner (keeper bot) can trigger this.
     */
    function rebalance(
        uint256 fromStrategy,
        uint256 toStrategy,
        uint256 amount
    ) external onlyOwner {
        require(fromStrategy < strategyCount && toStrategy < strategyCount, "Vault: invalid");
        require(strategies[toStrategy].active, "Vault: target inactive");
        require(strategies[fromStrategy].totalDeposited >= amount, "Vault: insufficient");

        strategies[fromStrategy].totalDeposited -= amount;
        strategies[toStrategy].totalDeposited += amount;

        // In production, this would call adapter.deposit() / adapter.withdraw()
        // For now we track allocations internally

        emit Rebalanced(fromStrategy, toStrategy, amount);
    }

    // ─── Revenue Collection ────────────────────────────────────────────────

    /**
     * @notice Record revenue collected from all 4 streams.
     *         Called by RevenueDistributor after harvesting.
     */
    function reportRevenue(
        uint256 _vaultYield,
        uint256 _stakingRewards,
        uint256 _lpFees,
        uint256 _revenueShare
    ) external onlyRevenueDistributor {
        cumulativeRevenue.vaultYield += _vaultYield;
        cumulativeRevenue.stakingRewards += _stakingRewards;
        cumulativeRevenue.lpFees += _lpFees;
        cumulativeRevenue.revenueShare += _revenueShare;

        // Add all revenue to total assets (compounds yield)
        uint256 totalRevenue = _vaultYield + _stakingRewards + _lpFees + _revenueShare;
        totalAssets += totalRevenue;

        emit RevenueCollected(_vaultYield, _stakingRewards, _lpFees, _revenueShare);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    function setRevenueDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Vault: zero addr");
        revenueDistributor = _distributor;
        emit RevenueDistributorUpdated(_distributor);
    }

    function setPerformanceFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 2000, "Vault: fee too high");
        performanceFeeBps = _feeBps;
    }
}
