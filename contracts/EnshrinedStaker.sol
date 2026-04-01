// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EnshrinedStaker
 * @notice Manages Initia Enshrined Liquidity staking — LP positions are staked
 *         directly with validators to earn staking rewards on top of LP fees.
 *         This is a unique Initia-native feature that doubles yield on LP positions.
 *
 *         Flow:
 *         1. VaultStrategy deposits LP tokens here
 *         2. Contract stakes them with whitelisted validators
 *         3. Staking rewards accrue and are harvested by RevenueDistributor
 *         4. LP trading fees still accrue to the LP position
 */
contract EnshrinedStaker is Ownable, ReentrancyGuard, IRevenueAdapter {
    using SafeERC20 for IERC20;

    // ─── Structs ───────────────────────────────────────────────────────────

    struct Validator {
        address validatorAddr;     // validator address on Initia
        uint256 totalStaked;       // total LP tokens staked with this validator
        uint256 stakingRewards;    // accumulated staking rewards
        bool    active;            // whether validator accepts new stake
        uint256 commissionBps;     // validator commission rate
    }

    struct StakePosition {
        uint256 validatorId;
        uint256 lpAmount;          // LP tokens staked
        uint256 stakedAt;
        uint256 pendingRewards;    // unharvested staking rewards
    }

    // ─── State ─────────────────────────────────────────────────────────────

    IERC20 public immutable lpToken;               // LP token to stake
    IERC20 public immutable rewardToken;            // staking reward token (INIT)
    address public vault;                           // VaultStrategy contract
    address public revenueDistributor;              // RevenueDistributor contract

    uint256 public validatorCount;
    uint256 public totalStaked;
    uint256 public totalRewardsHarvested;
    uint256 public epochDuration;                   // reward epoch length
    uint256 public currentEpoch;

    mapping(uint256 => Validator) public validators;
    mapping(address => StakePosition) public stakePositions;

    // ─── Events ────────────────────────────────────────────────────────────

    event ValidatorRegistered(uint256 indexed validatorId, address validator);
    event ValidatorUpdated(uint256 indexed validatorId, bool active);
    event Staked(address indexed vault, uint256 indexed validatorId, uint256 amount);
    event Unstaked(address indexed vault, uint256 indexed validatorId, uint256 amount);
    event RewardsHarvested(uint256 indexed epoch, uint256 totalRewards);
    event RewardsDistributed(uint256 totalRewards);
    event VaultUpdated(address indexed newVault);

    // ─── Modifiers ─────────────────────────────────────────────────────────

    modifier onlyVault() {
        require(msg.sender == vault, "Staker: only vault");
        _;
    }

    modifier onlyDistributor() {
        require(msg.sender == revenueDistributor || msg.sender == owner(), "Staker: not authorized");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────

    constructor(
        address _lpToken,
        address _rewardToken,
        uint256 _epochDuration
    ) Ownable(msg.sender) {
        require(_lpToken != address(0) && _rewardToken != address(0), "Staker: zero addr");
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardToken);
        epochDuration = _epochDuration;
    }

    // ─── Staking ───────────────────────────────────────────────────────────

    /**
     * @notice Stake LP tokens with a specific validator.
     *         Called by VaultStrategy after creating LP position.
     * @param amount LP tokens to stake
     * @param validatorId Index of the validator to stake with
     */
    function stake(
        uint256 amount,
        uint256 validatorId
    ) external onlyVault nonReentrant {
        require(amount > 0, "Staker: zero amount");
        require(validatorId < validatorCount, "Staker: invalid validator");
        require(validators[validatorId].active, "Staker: validator inactive");

        lpToken.safeTransferFrom(vault, address(this), amount);

        validators[validatorId].totalStaked += amount;
        totalStaked += amount;

        StakePosition storage pos = stakePositions[vault];
        pos.validatorId = validatorId;
        pos.lpAmount += amount;
        pos.stakedAt = block.timestamp;

        emit Staked(vault, validatorId, amount);
    }

    /**
     * @notice Unstake LP tokens from a validator.
     */
    function unstake(
        uint256 amount,
        uint256 validatorId
    ) external onlyVault nonReentrant {
        require(amount > 0, "Staker: zero amount");
        StakePosition storage pos = stakePositions[vault];
        require(pos.lpAmount >= amount, "Staker: insufficient stake");

        pos.lpAmount -= amount;
        validators[validatorId].totalStaked -= amount;
        totalStaked -= amount;

        lpToken.safeTransfer(vault, amount);

        emit Unstaked(vault, validatorId, amount);
    }

    // ─── Reward Harvesting (IRevenueAdapter) ───────────────────────────────

    /**
     * @notice Harvest accumulated staking rewards.
     *         Called by RevenueDistributor during harvest cycle.
     * @return amount Total staking rewards collected
     */
    function harvest() external override onlyDistributor nonReentrant returns (uint256 amount) {
        amount = _calculatePendingRewards();
        require(amount > 0, "Staker: no rewards");

        // Simulate reward distribution from validator
        // In production, this would claim from the Initia staking module
        _advanceEpoch();

        totalRewardsHarvested += amount;

        // Transfer rewards to distributor
        rewardToken.safeTransfer(revenueDistributor, amount);

        emit RewardsHarvested(currentEpoch, amount);
    }

    /**
     * @notice Calculate pending staking rewards across all validator positions
     */
    function _calculatePendingRewards() internal view returns (uint256) {
        // In production, this queries the Initia staking module for accrued rewards.
        // Simplified: estimate based on staked amount and epoch duration.
        uint256 estimatedRewards = 0;
        StakePosition memory pos = stakePositions[vault];

        if (pos.lpAmount > 0 && pos.validatorId < validatorCount) {
            uint256 elapsed = block.timestamp - pos.stakedAt;
            uint256 epochsElapsed = elapsed / epochDuration;

            // Estimate: ~10% APR staking reward, prorated by epochs
            // 10% APR = 1000 bps/year
            // Reward per epoch = (staked * 1000 * epochDuration) / (365 days * 10000)
            if (epochsElapsed > 0 && epochDuration > 0) {
                estimatedRewards = (pos.lpAmount * 1000 * epochsElapsed * epochDuration) /
                    (365 days * 10_000);
            }
        }

        return estimatedRewards + pos.pendingRewards;
    }

    function _advanceEpoch() internal {
        if (block.timestamp >= (currentEpoch + 1) * epochDuration) {
            currentEpoch++;
        }

        // Clear pending rewards for vault
        StakePosition storage pos = stakePositions[vault];
        pos.pendingRewards = 0;
        pos.stakedAt = block.timestamp;
    }

    /**
     * @notice Get current pending rewards for the vault
     */
    function getPendingRewards() external view returns (uint256) {
        return _calculatePendingRewards();
    }

    /**
     * @notice Get staking info summary
     */
    function getStakingInfo() external view returns (
        uint256 totalStaked_,
        uint256 pendingRewards_,
        uint256 totalHarvested_,
        uint256 activeValidators_
    ) {
        totalStaked_ = totalStaked;
        pendingRewards_ = _calculatePendingRewards();
        totalHarvested_ = totalRewardsHarvested;
        for (uint256 i = 0; i < validatorCount; i++) {
            if (validators[i].active) activeValidators_++;
        }
    }

    // ─── Validator Management ──────────────────────────────────────────────

    /**
     * @notice Register a new validator for enshrined staking
     */
    function registerValidator(
        address _validatorAddr,
        uint256 _commissionBps
    ) external onlyOwner returns (uint256 validatorId) {
        require(_validatorAddr != address(0), "Staker: zero validator");
        require(_commissionBps <= 10_000, "Staker: invalid commission");

        validatorId = validatorCount++;
        validators[validatorId] = Validator({
            validatorAddr: _validatorAddr,
            totalStaked: 0,
            stakingRewards: 0,
            active: true,
            commissionBps: _commissionBps
        });

        emit ValidatorRegistered(validatorId, _validatorAddr);
    }

    function updateValidator(uint256 _validatorId, bool _active) external onlyOwner {
        require(_validatorId < validatorCount, "Staker: invalid validator");
        validators[_validatorId].active = _active;
        emit ValidatorUpdated(_validatorId, _active);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Staker: zero addr");
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function setRevenueDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Staker: zero addr");
        revenueDistributor = _distributor;
    }
}
