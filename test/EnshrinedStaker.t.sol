// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/EnshrinedStaker.sol";
import "./mocks/MockERC20.sol";

/**
 * @title EnshrinedStakerTest
 * @notice Tests for the EnshrinedStaker contract — Initia's unique
 *         Enshrined Liquidity feature where LP positions are staked
 *         with validators to earn dual yield (LP fees + staking rewards).
 *
 * Covers:
 * - Validator registration and management
 * - Staking / unstaking LP tokens
 * - Reward calculation and harvesting
 * - Access control (vault-only, distributor-only)
 * - Epoch management
 * - IRevenueAdapter interface compliance
 */
contract EnshrinedStakerTest is Test {
    EnshrinedStaker staker;
    MockERC20 lpToken;
    MockERC20 rewardToken;

    address owner = makeAddr("owner");
    address vault = makeAddr("vault");
    address distributor = makeAddr("distributor");
    address validator1 = makeAddr("validator1");
    address validator2 = makeAddr("validator2");

    uint256 constant EPOCH_DURATION = 1 days;
    uint256 constant STAKE_AMOUNT = 10_000e18;

    function setUp() public {
        vm.startPrank(owner);

        lpToken = new MockERC20("LP Token", "LP", 18);
        rewardToken = new MockERC20("Initia", "INIT", 18);

        staker = new EnshrinedStaker(address(lpToken), address(rewardToken), EPOCH_DURATION);
        staker.setVault(vault);
        staker.setRevenueDistributor(distributor);

        // Register validators
        staker.registerValidator(validator1, 500); // 5% commission
        staker.registerValidator(validator2, 800); // 8% commission

        // Fund vault with LP tokens
        lpToken.mint(vault, 1_000_000e18);

        // Fund staker contract with reward tokens (simulate validator rewards)
        rewardToken.mint(address(staker), 1_000_000e18);

        vm.stopPrank();

        // Vault approves staker
        vm.prank(vault);
        lpToken.approve(address(staker), type(uint256).max);
    }

    // ─── Validator Management Tests ───────────────────────────────────────

    function test_register_validator() public {
        address newValidator = makeAddr("new_val");
        vm.prank(owner);
        uint256 id = staker.registerValidator(newValidator, 300);

        assertEq(id, 2); // 2 validators already registered
        assertEq(staker.validatorCount(), 3);

        (address valAddr,, , bool active, uint256 commission) = staker.validators(2);
        assertEq(valAddr, newValidator);
        assertTrue(active);
        assertEq(commission, 300);
    }

    function test_register_validator_reverts_zero_address() public {
        vm.prank(owner);
        vm.expectRevert("Staker: zero validator");
        staker.registerValidator(address(0), 100);
    }

    function test_register_validator_reverts_high_commission() public {
        vm.prank(owner);
        vm.expectRevert("Staker: invalid commission");
        staker.registerValidator(makeAddr("bad"), 10_001);
    }

    function test_update_validator() public {
        vm.prank(owner);
        staker.updateValidator(0, false);

        (, , , bool active,) = staker.validators(0);
        assertFalse(active);
    }

    // ─── Staking Tests ────────────────────────────────────────────────────

    function test_stake_basic() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        assertEq(staker.totalStaked(), STAKE_AMOUNT);

        (, uint256 lpAmount,,) = staker.stakePositions(vault);
        assertEq(lpAmount, STAKE_AMOUNT);

        (, uint256 validatorStaked,,,) = staker.validators(0);
        assertEq(validatorStaked, STAKE_AMOUNT);
    }

    function test_stake_reverts_zero_amount() public {
        vm.prank(vault);
        vm.expectRevert("Staker: zero amount");
        staker.stake(0, 0);
    }

    function test_stake_reverts_invalid_validator() public {
        vm.prank(vault);
        vm.expectRevert("Staker: invalid validator");
        staker.stake(STAKE_AMOUNT, 99);
    }

    function test_stake_reverts_inactive_validator() public {
        vm.prank(owner);
        staker.updateValidator(0, false);

        vm.prank(vault);
        vm.expectRevert("Staker: validator inactive");
        staker.stake(STAKE_AMOUNT, 0);
    }

    function test_stake_only_vault() public {
        vm.prank(owner);
        vm.expectRevert("Staker: only vault");
        staker.stake(STAKE_AMOUNT, 0);
    }

    function test_stake_accumulates() public {
        vm.startPrank(vault);
        staker.stake(5000e18, 0);
        staker.stake(3000e18, 0);
        vm.stopPrank();

        assertEq(staker.totalStaked(), 8000e18);

        (, uint256 lpAmount,,) = staker.stakePositions(vault);
        assertEq(lpAmount, 8000e18);
    }

    // ─── Unstaking Tests ──────────────────────────────────────────────────

    function test_unstake_basic() public {
        vm.startPrank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        uint256 balanceBefore = lpToken.balanceOf(vault);
        staker.unstake(STAKE_AMOUNT / 2, 0);
        uint256 balanceAfter = lpToken.balanceOf(vault);

        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT / 2);
        assertEq(staker.totalStaked(), STAKE_AMOUNT / 2);
        vm.stopPrank();
    }

    function test_unstake_reverts_insufficient() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        vm.prank(vault);
        vm.expectRevert("Staker: insufficient stake");
        staker.unstake(STAKE_AMOUNT + 1, 0);
    }

    function test_unstake_reverts_zero() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        vm.prank(vault);
        vm.expectRevert("Staker: zero amount");
        staker.unstake(0, 0);
    }

    function test_unstake_only_vault() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        vm.prank(owner);
        vm.expectRevert("Staker: only vault");
        staker.unstake(STAKE_AMOUNT, 0);
    }

    // ─── Harvest / Reward Tests ───────────────────────────────────────────

    function test_harvest_returns_rewards() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        // Warp past 1 epoch
        skip(EPOCH_DURATION + 1);

        uint256 distBalBefore = rewardToken.balanceOf(distributor);
        vm.prank(distributor);
        uint256 harvested = staker.harvest();
        uint256 distBalAfter = rewardToken.balanceOf(distributor);

        assertGt(harvested, 0);
        assertEq(distBalAfter - distBalBefore, harvested);
        assertEq(staker.totalRewardsHarvested(), harvested);
    }

    function test_harvest_only_distributor() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        skip(EPOCH_DURATION + 1);

        vm.prank(alice);
        vm.expectRevert("Staker: not authorized");
        staker.harvest();
    }

    function test_harvest_owner_can_harvest() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        skip(EPOCH_DURATION + 1);

        vm.prank(owner);
        uint256 harvested = staker.harvest();
        assertGt(harvested, 0);
    }

    // ─── Reward Calculation Tests ─────────────────────────────────────────

    function test_pending_rewards_increases_over_time() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        uint256 pending1 = staker.getPendingRewards();
        assertEq(pending1, 0); // No epochs elapsed yet

        skip(EPOCH_DURATION);
        uint256 pending2 = staker.getPendingRewards();
        assertGt(pending2, 0);
    }

    function test_get_staking_info() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);
        staker.registerValidator(makeAddr("v3"), 400);
        vm.prank(owner);
        staker.updateValidator(2, true);

        (
            uint256 totalStaked_,
            uint256 pendingRewards_,
            uint256 totalHarvested_,
            uint256 activeValidators_
        ) = staker.getStakingInfo();

        assertEq(totalStaked_, STAKE_AMOUNT);
        assertEq(totalHarvested_, 0);
        assertEq(activeValidators_, 3); // All 3 validators active
    }

    // ─── Epoch Tests ──────────────────────────────────────────────────────

    function test_epoch_advances() public {
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);

        skip(EPOCH_DURATION * 3 + 1);
        vm.prank(distributor);
        staker.harvest();

        // Epoch should have advanced
        assertGe(staker.currentEpoch(), 1);
    }

    // ─── IRevenueAdapter Compliance ───────────────────────────────────────

    function test_implements_revenue_adapter() public {
        // Verify it can be called through the interface
        vm.prank(vault);
        staker.stake(STAKE_AMOUNT, 0);
        skip(EPOCH_DURATION + 1);

        IRevenueAdapter adapter = IRevenueAdapter(address(staker));
        vm.prank(distributor);
        uint256 amount = adapter.harvest();
        assertGt(amount, 0);
    }

    // ─── Admin Tests ──────────────────────────────────────────────────────

    function test_set_vault() public {
        address newVault = makeAddr("new_vault");
        vm.prank(owner);
        staker.setVault(newVault);
        assertEq(staker.vault(), newVault);
    }

    function test_set_revenue_distributor() public {
        address newDist = makeAddr("new_dist");
        vm.prank(owner);
        staker.setRevenueDistributor(newDist);
        assertEq(staker.revenueDistributor(), newDist);
    }

    function test_non_owner_cannot_admin() public {
        vm.prank(alice);
        vm.expectRevert();
        staker.setVault(makeAddr("bad"));

        vm.prank(alice);
        vm.expectRevert();
        staker.registerValidator(makeAddr("bad"), 100);
    }

    // ─── Integration Scenario ─────────────────────────────────────────────

    function test_full_staking_lifecycle() public {
        // 1. Vault stakes LP tokens
        vm.prank(vault);
        staker.stake(50_000e18, 0);

        // 2. Time passes (2 epochs)
        skip(EPOCH_DURATION * 2);

        // 3. Distributor harvests rewards
        vm.prank(distributor);
        uint256 rewards = staker.harvest();
        assertGt(rewards, 0);

        // 4. Vault stakes more
        vm.prank(vault);
        staker.stake(30_000e18, 1); // Different validator

        // 5. More time passes
        skip(EPOCH_DURATION);

        // 6. Harvest again
        vm.prank(distributor);
        uint256 rewards2 = staker.harvest();
        assertGt(rewards2, 0);

        // 7. Verify final state
        assertEq(staker.totalStaked(), 80_000e18);
        assertGt(staker.totalRewardsHarvested(), rewards);

        // 8. Partial unstake
        vm.prank(vault);
        staker.unstake(20_000e18, 0);
        assertEq(staker.totalStaked(), 60_000e18);
    }
}
