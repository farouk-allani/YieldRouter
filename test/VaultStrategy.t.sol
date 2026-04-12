// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/VaultStrategy.sol";
import "./mocks/MockERC20.sol";

/**
 * @title VaultStrategyTest
 * @notice Tests for the core VaultStrategy contract.
 *
 * Covers:
 * - Deposit / withdrawal mechanics and share math
 * - Strategy registration and selection
 * - Rebalancing between strategies
 * - Revenue reporting and compounding
 * - Access control and edge cases
 */
contract VaultStrategyTest is Test {
    VaultStrategy vault;
    MockERC20 asset;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address distributor = makeAddr("distributor");

    uint256 constant INITIAL_BALANCE = 10_000e18;
    uint256 constant PERFORMANCE_FEE = 500; // 5%
    uint256 constant MAX_STRATEGIES = 5;

    function setUp() public {
        vm.startPrank(owner);

        asset = new MockERC20("Initia USD", "IUSD", 18);
        vault = new VaultStrategy(address(asset), MAX_STRATEGIES, PERFORMANCE_FEE);

        // Set revenue distributor
        vault.setRevenueDistributor(distributor);

        // Fund test users
        asset.mint(alice, INITIAL_BALANCE);
        asset.mint(bob, INITIAL_BALANCE);
        asset.mint(distributor, INITIAL_BALANCE);

        // Approve vault
        vm.stopPrank();
        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        asset.approve(address(vault), type(uint256).max);
        vm.prank(distributor);
        asset.approve(address(vault), type(uint256).max);

        // Add strategies
        vm.prank(owner);
        vault.addStrategy(makeAddr("adapter1"), 1200, 3); // 12% APY, risk 3

        vm.prank(owner);
        vault.addStrategy(makeAddr("adapter2"), 2400, 7); // 24% APY, risk 7

        vm.prank(owner);
        vault.addStrategy(makeAddr("adapter3"), 800, 2);  // 8% APY, risk 2
    }

    // ─── Deposit Tests ────────────────────────────────────────────────────

    function test_deposit_basic() public {
        uint256 amount = 1000e18;
        vm.prank(alice);
        uint256 shares = vault.deposit(amount);

        // First deposit: shares == assets (1:1 ratio at start)
        assertEq(shares, amount);
        assertEq(vault.totalAssets(), amount);
        assertEq(vault.totalShares(), shares);
        assertEq(vault.getPositionValue(alice), amount);
    }

    function test_deposit_routes_to_best_strategy() public {
        uint256 amount = 1000e18;
        vm.prank(alice);
        vault.deposit(amount);

        // Should route to strategy 1 (APY 2400 = 24%)
        (,, uint256 strategyId) = vault.positions(alice);
        assertEq(strategyId, 1);
        (, uint256 totalDeposited,,,) = vault.strategies(1);
        assertEq(totalDeposited, amount);
    }

    function test_deposit_reverts_on_zero() public {
        vm.prank(alice);
        vm.expectRevert("Vault: zero deposit");
        vault.deposit(0);
    }

    function test_deposit_reverts_without_active_strategy() public {
        // Deactivate all strategies
        vm.prank(owner);
        vault.updateStrategy(0, 1200, false);
        vm.prank(owner);
        vault.updateStrategy(1, 2400, false);
        vm.prank(owner);
        vault.updateStrategy(2, 800, false);

        vm.startPrank(alice);
        vm.expectRevert("Vault: no active strategy");
        vault.deposit(1000e18);
    }

    function test_deposit_multiple_users() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.prank(bob);
        vault.deposit(2000e18);

        assertEq(vault.totalAssets(), 3000e18);
        assertEq(vault.getPositionValue(alice), 1000e18);
        assertEq(vault.getPositionValue(bob), 2000e18);
    }

    // ─── Withdrawal Tests ─────────────────────────────────────────────────

    function test_withdraw_basic() public {
        vm.startPrank(alice);
        uint256 shares = vault.deposit(1000e18);

        uint256 balanceBefore = asset.balanceOf(alice);
        vault.withdraw(shares);
        uint256 balanceAfter = asset.balanceOf(alice);

        assertEq(balanceAfter - balanceBefore, 1000e18);
        assertEq(vault.totalAssets(), 0);
        assertEq(vault.totalShares(), 0);
        assertEq(vault.getPositionValue(alice), 0);
        vm.stopPrank();
    }

    function test_withdraw_partial() public {
        vm.startPrank(alice);
        uint256 shares = vault.deposit(1000e18);
        vault.withdraw(shares / 2);

        assertApproxEqRel(vault.getPositionValue(alice), 500e18, 1e16); // 1% tolerance
        vm.stopPrank();
    }

    function test_withdraw_reverts_insufficient_shares() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.prank(alice);
        vm.expectRevert("Vault: insufficient shares");
        vault.withdraw(1001e18);
    }

    // ─── Share Math Tests ─────────────────────────────────────────────────

    function test_share_price_appreciates_with_revenue() public {
        // Alice deposits
        vm.prank(alice);
        vault.deposit(1000e18);

        // Revenue is reported — this compounds the vault
        vm.prank(distributor);
        vault.reportRevenue(50e18, 20e18, 15e18, 10e18); // 95 total

        // Alice's position should be worth more now
        assertGt(vault.getPositionValue(alice), 1000e18);
        assertEq(vault.totalAssets(), 1095e18);
    }

    function test_second_depositor_gets_fair_shares() public {
        // Alice deposits 1000
        vm.prank(alice);
        vault.deposit(1000e18);

        // Revenue compounds vault value by 10%
        vm.prank(distributor);
        vault.reportRevenue(100e18, 0, 0, 0);

        // Bob deposits 1000 — should get fewer shares (price appreciated)
        uint256 bobSharesBefore = vault.totalShares();
        vm.prank(bob);
        uint256 bobShares = vault.deposit(1000e18);
        uint256 bobSharesAfter = vault.totalShares();

        // Bob's shares should be less than 1000e18 since price went up
        assertLt(bobShares, 1000e18);
        assertEq(bobSharesAfter - bobSharesBefore, bobShares);
    }

    // ─── Strategy Management Tests ────────────────────────────────────────

    function test_get_best_strategy() public {
        (uint256 bestId, uint256 bestApy) = vault.getBestStrategy();
        assertEq(bestId, 1); // Strategy 1 has 24% APY
        assertEq(bestApy, 2400);
    }

    function test_get_best_strategy_skips_inactive() public {
        vm.prank(owner);
        vault.updateStrategy(1, 2400, false); // deactivate best

        (uint256 bestId, uint256 bestApy) = vault.getBestStrategy();
        assertEq(bestId, 0); // Strategy 0 now best (12%)
        assertEq(bestApy, 1200);
    }

    function test_add_strategy_reverts_at_max() public {
        vm.startPrank(owner);
        vault.addStrategy(makeAddr("a4"), 1000, 5);
        vault.addStrategy(makeAddr("a5"), 1000, 5);

        vm.expectRevert("Vault: max strategies");
        vault.addStrategy(makeAddr("a6"), 1000, 5);
        vm.stopPrank();
    }

    function test_add_strategy_reverts_invalid_risk() public {
        vm.prank(owner);
        vm.expectRevert("Vault: invalid risk");
        vault.addStrategy(makeAddr("bad"), 1000, 11);
    }

    // ─── Rebalance Tests ──────────────────────────────────────────────────

    function test_rebalance() public {
        // Deposit into strategy 1 (best APY)
        vm.prank(alice);
        vault.deposit(1000e18);

        (, uint256 strat1Before,,,) = vault.strategies(1);
        (, uint256 strat0Before,,,) = vault.strategies(0);

        vm.prank(owner);
        vault.rebalance(1, 0, 500e18);

        (, uint256 strat1After,,,) = vault.strategies(1);
        (, uint256 strat0After,,,) = vault.strategies(0);
        assertEq(strat1After, strat1Before - 500e18);
        assertEq(strat0After, strat0Before + 500e18);
    }

    function test_rebalance_reverts_inactive_target() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.prank(owner);
        vault.updateStrategy(0, 1200, false);

        vm.prank(owner);
        vm.expectRevert("Vault: target inactive");
        vault.rebalance(1, 0, 500e18);
    }

    // ─── Revenue Reporting Tests ──────────────────────────────────────────

    function test_report_revenue_accumulates() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.prank(distributor);
        vault.reportRevenue(10, 20, 30, 40);

        (uint256 vy, uint256 sr, uint256 lf, uint256 rs) = vault.cumulativeRevenue();
        assertEq(vy, 10);
        assertEq(sr, 20);
        assertEq(lf, 30);
        assertEq(rs, 40);
    }

    function test_report_revenue_only_distributor() public {
        vm.prank(alice);
        vm.expectRevert("Vault: only distributor");
        vault.reportRevenue(10, 10, 10, 10);
    }

    // ─── Admin Tests ──────────────────────────────────────────────────────

    function test_set_performance_fee() public {
        vm.prank(owner);
        vault.setPerformanceFee(1000);
        assertEq(vault.performanceFeeBps(), 1000);
    }

    function test_set_performance_fee_reverts_too_high() public {
        vm.prank(owner);
        vm.expectRevert("Vault: fee too high");
        vault.setPerformanceFee(2001);
    }

    function test_set_revenue_distributor() public {
        address newDistributor = makeAddr("new_dist");
        vm.prank(owner);
        vault.setRevenueDistributor(newDistributor);
        assertEq(vault.revenueDistributor(), newDistributor);
    }

    function test_non_owner_cannot_call_admin() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setPerformanceFee(100);

        vm.prank(alice);
        vm.expectRevert();
        vault.addStrategy(makeAddr("s"), 100, 5);
    }

    // ─── View Function Tests ──────────────────────────────────────────────

    function test_convertToShares_zero_assets() public {
        uint256 shares = vault.convertToShares(100e18);
        assertEq(shares, 100e18 * 1e18);
    }

    function test_convertToAssets_zero_shares() public {
        uint256 assets = vault.convertToAssets(100e18 * 1e18);
        assertEq(assets, 100e18);
    }

    // ─── Fuzz Tests ───────────────────────────────────────────────────────

    function testFuzz_deposit_withdraw_roundtrip(uint256 amount) public {
        amount = bound(amount, 1e18, INITIAL_BALANCE / 2);

        vm.startPrank(alice);
        uint256 shares = vault.deposit(amount);
        vault.withdraw(shares);

        // Should get back approximately same amount (no revenue = exact)
        assertEq(vault.getPositionValue(alice), 0);
        vm.stopPrank();
    }

    function testFuzz_deposit_preserves_total(uint256 amountAlice, uint256 amountBob) public {
        amountAlice = bound(amountAlice, 1e18, INITIAL_BALANCE / 2);
        amountBob = bound(amountBob, 1e18, INITIAL_BALANCE / 2);

        vm.prank(alice);
        vault.deposit(amountAlice);
        vm.prank(bob);
        vault.deposit(amountBob);

        assertEq(vault.totalAssets(), amountAlice + amountBob);
    }
}
