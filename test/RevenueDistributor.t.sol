// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/VaultStrategy.sol";
import "../contracts/RevenueDistributor.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockRevenueAdapter.sol";

/**
 * @title RevenueDistributorTest
 * @notice Tests for the RevenueDistributor contract.
 *
 * Covers:
 * - Harvest cycle with 4 revenue streams
 * - Performance fee collection
 * - Stream registration and management
 * - Keeper access control
 * - Integration with VaultStrategy
 * - Harvest interval enforcement
 */
contract RevenueDistributorTest is Test {
    VaultStrategy vault;
    RevenueDistributor distributor;
    MockERC20 asset;

    MockRevenueAdapter vaultYieldAdapter;
    MockRevenueAdapter stakingAdapter;
    MockRevenueAdapter lpFeesAdapter;
    MockRevenueAdapter revenueShareAdapter;

    address owner = makeAddr("owner");
    address keeper = makeAddr("keeper");
    address alice = makeAddr("alice");

    uint256 constant HARVEST_INTERVAL = 1 hours;
    uint256 constant PERFORMANCE_FEE = 300; // 3%
    uint256 constant ADAPTER_HARVEST_AMOUNT = 100e18;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy token
        asset = new MockERC20("Initia USD", "IUSD", 18);

        // Deploy vault
        vault = new VaultStrategy(address(asset), 5, 500);
        vault.addStrategy(makeAddr("strat"), 1200, 3);

        // Deploy distributor
        distributor = new RevenueDistributor(address(asset), HARVEST_INTERVAL, PERFORMANCE_FEE);
        distributor.setVault(address(vault));
        distributor.setKeeper(keeper);

        // Link vault <-> distributor
        vault.setRevenueDistributor(address(distributor));

        // Deploy mock adapters
        vaultYieldAdapter = new MockRevenueAdapter(address(asset), address(distributor), ADAPTER_HARVEST_AMOUNT);
        stakingAdapter = new MockRevenueAdapter(address(asset), address(distributor), ADAPTER_HARVEST_AMOUNT);
        lpFeesAdapter = new MockRevenueAdapter(address(asset), address(distributor), ADAPTER_HARVEST_AMOUNT);
        revenueShareAdapter = new MockRevenueAdapter(address(asset), address(distributor), ADAPTER_HARVEST_AMOUNT);

        // Register revenue sources
        distributor.registerSource(0, address(vaultYieldAdapter));
        distributor.registerSource(1, address(stakingAdapter));
        distributor.registerSource(2, address(lpFeesAdapter));
        distributor.registerSource(3, address(revenueShareAdapter));

        // Fund adapters so they can transfer tokens
        asset.mint(address(vaultYieldAdapter), 100_000e18);
        asset.mint(address(stakingAdapter), 100_000e18);
        asset.mint(address(lpFeesAdapter), 100_000e18);
        asset.mint(address(revenueShareAdapter), 100_000e18);

        // Fund alice and approve vault
        asset.mint(alice, 10_000e18);

        vm.stopPrank();

        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);
    }

    // ─── Harvest Tests ────────────────────────────────────────────────────

    function test_harvest_basic() public {
        // Alice deposits so vault has assets
        vm.prank(alice);
        vault.deposit(1000e18);

        // Warp past harvest interval
        skip(HARVEST_INTERVAL + 1);

        vm.prank(keeper);
        RevenueDistributor.HarvestResult memory result = distributor.harvest();

        // Each adapter returns 100e18
        assertEq(result.vaultYield, ADAPTER_HARVEST_AMOUNT);
        assertEq(result.stakingRewards, ADAPTER_HARVEST_AMOUNT);
        assertEq(result.lpFees, ADAPTER_HARVEST_AMOUNT);
        assertEq(result.revenueShare, ADAPTER_HARVEST_AMOUNT);

        uint256 totalGross = ADAPTER_HARVEST_AMOUNT * 4;
        uint256 expectedFee = (totalGross * PERFORMANCE_FEE) / 10_000;
        uint256 expectedNet = totalGross - expectedFee;

        assertEq(result.totalRevenue, totalGross);
        assertEq(distributor.totalDistributed(), expectedNet);

        // Vault should have received net revenue
        assertGt(vault.totalAssets(), 1000e18);
    }

    function test_harvest_reverts_too_early() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.prank(keeper);
        vm.expectRevert("Distributor: too early");
        distributor.harvest();
    }

    function test_harvest_reverts_no_vault() public {
        vm.startPrank(owner);
        RevenueDistributor dist2 = new RevenueDistributor(address(asset), HARVEST_INTERVAL, PERFORMANCE_FEE);
        dist2.registerSource(0, address(vaultYieldAdapter));
        vm.stopPrank();

        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        vm.expectRevert("Distributor: no vault");
        dist2.harvest();
    }

    function test_harvest_skips_inactive_sources() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        // Deactivate LP fees stream
        vm.prank(owner);
        distributor.updateSource(2, false);

        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        RevenueDistributor.HarvestResult memory result = distributor.harvest();

        // LP fees should be zero
        assertEq(result.lpFees, 0);
        // Other streams still active
        assertEq(result.vaultYield, ADAPTER_HARVEST_AMOUNT);
    }

    // ─── Performance Fee Tests ────────────────────────────────────────────

    function test_performance_fee_goes_to_owner() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        uint256 ownerBefore = asset.balanceOf(owner);

        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        distributor.harvest();

        uint256 ownerAfter = asset.balanceOf(owner);
        uint256 totalGross = ADAPTER_HARVEST_AMOUNT * 4;
        uint256 expectedFee = (totalGross * PERFORMANCE_FEE) / 10_000;

        assertEq(ownerAfter - ownerBefore, expectedFee);
    }

    // ─── Access Control Tests ─────────────────────────────────────────────

    function test_only_owner_can_register_source() public {
        vm.prank(alice);
        vm.expectRevert();
        distributor.registerSource(0, makeAddr("adapter"));
    }

    function test_only_owner_can_update_source() public {
        vm.prank(alice);
        vm.expectRevert();
        distributor.updateSource(0, false);
    }

    function test_owner_can_harvest() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        skip(HARVEST_INTERVAL + 1);
        // Owner can also harvest (not just keeper)
        vm.prank(owner);
        RevenueDistributor.HarvestResult memory result = distributor.harvest();
        assertGt(result.totalRevenue, 0);
    }

    function test_non_keeper_non_owner_cannot_harvest() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        skip(HARVEST_INTERVAL + 1);
        vm.prank(alice);
        vm.expectRevert("Distributor: not keeper");
        distributor.harvest();
    }

    // ─── View Function Tests ──────────────────────────────────────────────

    function test_get_revenue_breakdown() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        distributor.harvest();

        (uint256[4] memory streamTotals, uint256 grandTotal) = distributor.getRevenueBreakdown();

        for (uint256 i = 0; i < 4; i++) {
            assertEq(streamTotals[i], ADAPTER_HARVEST_AMOUNT);
        }
        assertEq(grandTotal, ADAPTER_HARVEST_AMOUNT * 4);
    }

    function test_get_total_lifetime_revenue() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        // Harvest twice
        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        distributor.harvest();

        skip(HARVEST_INTERVAL + 1);
        vm.prank(keeper);
        distributor.harvest();

        uint256 totalRevenue = distributor.getTotalLifetimeRevenue();
        assertEq(totalRevenue, ADAPTER_HARVEST_AMOUNT * 4 * 2);
    }

    // ─── Admin Tests ──────────────────────────────────────────────────────

    function test_set_vault() public {
        address newVault = makeAddr("new_vault");
        vm.prank(owner);
        distributor.setVault(newVault);
        assertEq(distributor.vault(), newVault);
    }

    function test_set_harvest_interval() public {
        vm.prank(owner);
        distributor.setHarvestInterval(30 minutes);
        assertEq(distributor.harvestInterval(), 30 minutes);
    }

    function test_set_keeper() public {
        address newKeeper = makeAddr("new_keeper");
        vm.prank(owner);
        distributor.setKeeper(newKeeper);
        assertEq(distributor.keeper(), newKeeper);
    }

    // ─── Multiple Harvest Cycles ──────────────────────────────────────────

    function test_multiple_harvests() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        for (uint256 i = 0; i < 5; i++) {
            skip(HARVEST_INTERVAL + 1);
            vm.prank(keeper);
            distributor.harvest();
        }

        // Revenue should compound into vault
        assertGt(vault.totalAssets(), 1000e18 + (ADAPTER_HARVEST_AMOUNT * 4));
    }
}
