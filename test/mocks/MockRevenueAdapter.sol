// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IRevenueAdapter {
    function harvest() external returns (uint256 amount);
}

/**
 * @title MockRevenueAdapter
 * @notice Simulates a revenue adapter that holds tokens and dispenses them on harvest().
 */
contract MockRevenueAdapter is IRevenueAdapter {
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;
    address public distributor;
    uint256 public harvestAmount;

    constructor(address _rewardToken, address _distributor, uint256 _harvestAmount) {
        rewardToken = IERC20(_rewardToken);
        distributor = _distributor;
        harvestAmount = _harvestAmount;
    }

    function harvest() external override returns (uint256 amount) {
        amount = harvestAmount;
        rewardToken.safeTransfer(distributor, amount);
        return amount;
    }

    function setHarvestAmount(uint256 _amount) external {
        harvestAmount = _amount;
    }
}
