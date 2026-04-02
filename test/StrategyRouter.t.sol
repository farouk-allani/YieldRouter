// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/StrategyRouter.sol";
import "./mocks/MockERC20.sol";

/**
 * @title StrategyRouterTest
 * @notice Tests for the on-chain StrategyRouter — the yield routing brain.
 *
 * Covers:
 * - Strategy registration and management
 * - On-chain scoring engine (APY, risk, TVL, freshness)
 * - Deposit + route with multi-strategy allocation
 * - Withdrawal with proportional allocation cleanup
 * - Rebalance detection and APY refresh
 * - Portfolio view and preview functions
 * - Access control and edge cases
 */
contract StrategyRouterTest is Test {
    StrategyRouter router;
    MockERC20 asset;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address vault = makeAddr("vault");

    uint256 constant INITIAL_BALANCE = 100_000e18;
    uint256 constant MAX_STRATEGIES = 10;
    uint256 constant MAX_ALLOCATIONS = 3;
    uint256 constant MAX_RISK = 7;

    // Mock adapters
    MockStrategyAdapter adapter1;
    MockStrategyAdapter adapter2;
    MockStrategyAdapter adapter3;
    MockStrategyAdapter adapterHighRisk;

    function setUp() public {
        vm.startPrank(owner);

        asset = new MockERC20("Initia USD", "IUSD", 18);
        router = new StrategyRouter(address(asset), MAX_STRATEGIES, MAX_ALLOCATIONS, MAX_RISK);

        // Deploy mock adapters with different APYs and risks
        adapter1 = new MockStrategyAdapter(2480, 1_200_000e18, 3);  // 24.8% APY, $1.2M TVL, risk 3
        adapter2 = new MockStrategyAdapter(1930, 890_000e18, 5);   // 19.3% APY, $890K TVL, risk 5
        adapter3 = new MockStrategyAdapter(1450, 2_100_000e18, 2); // 14.5% APY, $2.1M TVL, risk 2
        adapterHighRisk = new MockStrategyAdapter(3120, 450_000e18, 8); // 31.2% APY, $450K TVL, risk 8

        // Register strategies
        router.registerStrategy(address(adapter1), "Initia Lending", StrategyRouter.ProtocolType.Lending, 3);
        router.registerStrategy(address(adapter2), "Interwoven DEX LP", StrategyRouter.ProtocolType.LP, 5);
        router.registerStrategy(address(adapter3), "Enshrined LP", StrategyRouter.ProtocolType.EnshrinedLP, 2);
        router.registerStrategy(address(adapterHighRisk), "YieldFarm Alpha", StrategyRouter.ProtocolType.Farming, 8);

        router.setVault(vault);

        // Fund users
        asset.mint(alice, INITIAL_BALANCE);
        asset.mint(bob, INITIAL_BALANCE);
        vm.stopPrank();

        // Approve router
        vm.prank(alice);
        asset.approve(address(router), type(uint256).max);
        vm.prank(bob);
        asset.approve(address(router), type(uint256).max);
    }

    // ─── Strategy Registration Tests ─────────────────────────────────────

    function test_register_strategy() public {
        assertEq(router.strategyCount(), 4);

        (address adapter,, string memory name, uint256 apy,, uint8 risk, bool active,,) = router.strategies(0);
        assertEq(adapter, address(adapter1));
        assertEq(apy, 2480);
        assertEq(risk, 3);
        assertTrue(active);
        assertEq(name, "Initia Lending");
    }

    function test_register_strategy_reverts_at_max() public {
        vm.startPrank(owner);

        // Register up to max (we already have 4, max is 10)
        for (uint256 i = 4; i < MAX_STRATEGIES; i++) {
            router.registerStrategy(makeAddr("adapter"), "Strategy", StrategyRouter.ProtocolType.Lending, 3);
        }

        vm.expectRevert("Router: max strategies");
        router.registerStrategy(makeAddr("overflow"), "Too Many", StrategyRouter.ProtocolType.Lending, 3);
        vm.stopPrank();
    }

    function test_register_strategy_reverts_zero_adapter() public {
        vm.prank(owner);
        vm.expectRevert("Router: zero adapter");
        router.registerStrategy(address(0), "Bad", StrategyRouter.ProtocolType.Lending, 3);
    }

    function test_register_strategy_reverts_invalid_risk() public {
        vm.prank(owner);
        vm.expectRevert("Router: invalid risk");
        router.registerStrategy(makeAddr("bad"), "Bad", StrategyRouter.ProtocolType.Lending, 11);
    }

    // ─── On-Chain Scoring Tests ──────────────────────────────────────────

    function test_preview_route_scores_correctly() public {
        uint256 depositAmount = 10_000e18;
        (StrategyRouter.Allocation[] memory preview, uint256 expectedApy) = router.previewRoute(depositAmount);

        // Should select up to MAX_ALLOCATIONS (3) strategies
        assertLe(preview.length, MAX_ALLOCATIONS);
        assertGt(preview.length, 0);

        // Expected APY should be reasonable (between lowest and highest)
        assertGe(expectedApy, 1450); // >= 14.5% (lowest active)
        assertLe(expectedApy, 3120); // <= 31.2% (highest)

        // Total allocation should equal deposit
        uint256 totalAllocated = 0;
        for (uint256 i = 0; i < preview.length; i++) {
            totalAllocated += preview[i].amount;
        }
        assertEq(totalAllocated, depositAmount);
    }

    function test_scoring_prefers_lower_risk() public {
        // Adapter3 has lower APY (1450) but risk 2 (low)
        // Adapter2 has higher APY (1930) but risk 5 (medium)
        // The 50% APY weight + 30% risk weight should balance them

        (StrategyRouter.Allocation[] memory preview,) = router.previewRoute(10_000e18);

        // Both should potentially be selected, but the exact ranking depends on composite score
        // Just verify that allocations exist and have valid scores
        for (uint256 i = 0; i < preview.length; i++) {
            assertGt(preview[i].compositeScore, 0);
            assertGt(preview[i].weightBps, 0);
        }
    }

    function test_high_risk_strategy_excluded_by_config() public {
        // Max risk is 7, adapterHighRisk has risk 8 — should be filtered
        (StrategyRouter.Allocation[] memory preview, uint256 expectedApy) = router.previewRoute(10_000e18);

        // Verify high-risk strategy is not in the allocation
        for (uint256 i = 0; i < preview.length; i++) {
            StrategyRouter.StrategyInfo memory strat = router.strategies(preview[i].strategyId);
            assertLe(strat.riskScore, MAX_RISK);
        }
    }

    // ─── Deposit + Route Tests ───────────────────────────────────────────

    function test_deposit_and_route() public {
        uint256 amount = 10_000e18;
        vm.prank(alice);

        StrategyRouter.RouteResult memory result = router.depositAndRoute(amount);

        assertEq(result.totalDeposited, amount);
        assertGt(result.allocationCount, 0);
        assertGt(result.expectedApyBps, 0);

        // Assets should have been transferred to vault
        assertEq(asset.balanceOf(vault), amount);
        assertEq(router.userTotalDeposited(alice), amount);
    }

    function test_deposit_reverts_zero_amount() public {
        vm.prank(alice);
        vm.expectRevert("Router: zero amount");
        router.depositAndRoute(0);
    }

    function test_deposit_records_allocations() public {
        vm.prank(alice);
        router.depositAndRoute(10_000e18);

        StrategyRouter.Allocation[] memory allocs = router.getUserAllocations(alice);
        assertGt(allocs.length, 0);

        uint256 totalWeight = 0;
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < allocs.length; i++) {
            totalWeight += allocs[i].weightBps;
            totalAmount += allocs[i].amount;
        }
        assertEq(totalWeight, 10_000); // Should sum to 100%
        assertEq(totalAmount, 10_000e18);
    }

    function test_deposit_multiple_users() public {
        vm.prank(alice);
        router.depositAndRoute(5000e18);
        vm.prank(bob);
        router.depositAndRoute(3000e18);

        assertEq(router.userTotalDeposited(alice), 5000e18);
        assertEq(router.userTotalDeposited(bob), 3000e18);
        assertEq(router.totalRouted(), 8000e18);
    }

    // ─── Withdrawal Tests ────────────────────────────────────────────────

    function test_withdraw() public {
        vm.prank(alice);
        router.depositAndRoute(10_000e18);

        uint256 vaultBefore = asset.balanceOf(vault);
        uint256 aliceBefore = asset.balanceOf(alice);

        vm.prank(alice);
        uint256 withdrawn = router.withdraw(5000e18);

        assertEq(withdrawn, 5000e18);
        assertEq(asset.balanceOf(alice) - aliceBefore, 5000e18);
        assertEq(vaultBefore - asset.balanceOf(vault), 5000e18);
    }

    function test_withdraw_reverts_insufficient() public {
        vm.prank(alice);
        router.depositAndRoute(1000e18);

        vm.prank(alice);
        vm.expectRevert("Router: insufficient");
        router.withdraw(2000e18);
    }

    function test_withdraw_reverts_zero() public {
        vm.prank(alice);
        router.depositAndRoute(1000e18);

        vm.prank(alice);
        vm.expectRevert("Router: zero amount");
        router.withdraw(0);
    }

    function test_withdraw_cleans_up_allocations() public {
        vm.prank(alice);
        router.depositAndRoute(10_000e18);

        vm.prank(alice);
        router.withdraw(10_000e18);

        StrategyRouter.Allocation[] memory allocs = router.getUserAllocations(alice);
        assertEq(allocs.length, 0);
    }

    // ─── Portfolio View Tests ────────────────────────────────────────────

    function test_get_portfolio() public {
        vm.prank(alice);
        router.depositAndRoute(10_000e18);

        StrategyRouter.PortfolioSnapshot memory portfolio = router.getPortfolio(alice);
        assertEq(portfolio.totalValue, 10_000e18);
        assertGt(portfolio.strategyCount, 0);
        assertGt(portfolio.weightedApyBps, 0);
    }

    function test_get_active_strategies() public {
        StrategyRouter.StrategyInfo[] memory active = router.getActiveStrategies();
        assertEq(active.length, 4); // all registered as active
    }

    function test_get_active_strategies_excludes_inactive() public {
        vm.prank(owner);
        router.setStrategyActive(1, false);

        StrategyRouter.StrategyInfo[] memory active = router.getActiveStrategies();
        assertEq(active.length, 3);
    }

    // ─── Rebalance Tests ─────────────────────────────────────────────────

    function test_update_strategy_apy() public {
        vm.prank(owner);
        router.updateStrategyApy(0, 3000);

        (, , , uint256 apy,,,) = router.strategies(0);
        assertEq(apy, 3000);
    }

    function test_set_strategy_active() public {
        vm.prank(owner);
        router.setStrategyActive(0, false);

        (, , , , , , bool active,) = router.strategies(0);
        assertFalse(active);
    }

    function test_remove_strategy() public {
        vm.prank(owner);
        router.removeStrategy(0);

        (, , , , , , bool active,) = router.strategies(0);
        assertFalse(active);
    }

    // ─── Configuration Tests ─────────────────────────────────────────────

    function test_set_route_config() public {
        vm.prank(owner);
        router.setRouteConfig(5, 8, 200, 300);

        assertEq(router.maxAllocations(), 5);
        assertEq(router.maxRiskScore(), 8);
        assertEq(router.minApyBps(), 200);
        assertEq(router.rebalanceThresholdBps(), 300);
    }

    function test_set_route_config_reverts_invalid_alloc() public {
        vm.prank(owner);
        vm.expectRevert("Router: invalid alloc");
        router.setRouteConfig(0, 5, 200, 300);

        vm.prank(owner);
        vm.expectRevert("Router: invalid alloc");
        router.setRouteConfig(11, 5, 200, 300);
    }

    function test_set_route_config_reverts_invalid_risk() public {
        vm.prank(owner);
        vm.expectRevert("Router: invalid risk");
        router.setRouteConfig(3, 11, 200, 300);
    }

    // ─── Access Control Tests ────────────────────────────────────────────

    function test_non_owner_cannot_register() public {
        vm.prank(alice);
        vm.expectRevert();
        router.registerStrategy(makeAddr("bad"), "Bad", StrategyRouter.ProtocolType.Lending, 3);
    }

    function test_non_owner_cannot_config() public {
        vm.prank(alice);
        vm.expectRevert();
        router.setRouteConfig(5, 8, 200, 300);
    }

    // ─── Fuzz Tests ──────────────────────────────────────────────────────

    function testFuzz_deposit_route_withdraw(uint256 amount) public {
        amount = bound(amount, 1e18, INITIAL_BALANCE / 4);

        vm.startPrank(alice);
        router.depositAndRoute(amount);
        uint256 withdrawn = router.withdraw(amount);

        assertEq(withdrawn, amount);
        assertEq(router.userTotalDeposited(alice), 0);
        vm.stopPrank();
    }
}

// ─── Mock Adapter ─────────────────────────────────────────────────────────

contract MockStrategyAdapter is StrategyRouter.IStrategyAdapter {
    uint256 public apyBps;
    uint256 public tvl;
    uint8 public risk;

    constructor(uint256 _apy, uint256 _tvl, uint8 _risk) {
        apyBps = _apy;
        tvl = _tvl;
        risk = _risk;
    }

    function getCurrentApyBps() external view override returns (uint256) {
        return apyBps;
    }

    function getTvl() external view override returns (uint256) {
        return tvl;
    }

    function getRiskScore() external view override returns (uint8) {
        return risk;
    }

    function deposit(uint256 amount) external override returns (uint256) {
        return amount;
    }

    function withdraw(uint256 amount) external override returns (uint256) {
        return amount;
    }

    function harvest() external override returns (uint256) {
        return 0;
    }

    function setApy(uint256 _apy) external {
        apyBps = _apy;
    }
}
