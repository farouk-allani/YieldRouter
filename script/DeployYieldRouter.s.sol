// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/VaultStrategy.sol";
import "../contracts/RevenueDistributor.sol";
import "../contracts/EnshrinedStaker.sol";

/**
 * @title DeployYieldRouter
 * @notice Forge deployment script for YieldRouter contracts.
 *
 * Usage:
 *   forge script script/DeployYieldRouter.s.sol --rpc-url $RPC --broadcast --verify
 */
contract DeployYieldRouter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address asset = vm.envAddress("ASSET_ADDRESS");
        address lpToken = vm.envAddress("LP_TOKEN_ADDRESS");
        address rewardToken = vm.envAddress("REWARD_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy VaultStrategy
        VaultStrategy vault = new VaultStrategy(
            asset,
            5,      // maxStrategies
            500     // performanceFeeBps (5%)
        );

        // 2. Deploy RevenueDistributor
        RevenueDistributor distributor = new RevenueDistributor(
            asset,
            1 hours, // harvestInterval
            300      // performanceFeeBps (3%)
        );

        // 3. Deploy EnshrinedStaker
        EnshrinedStaker staker = new EnshrinedStaker(
            lpToken,
            rewardToken,
            1 days // epochDuration
        );

        // 4. Wire contracts together
        vault.setRevenueDistributor(address(distributor));

        distributor.setVault(address(vault));
        distributor.setKeeper(msg.sender);

        staker.setVault(address(vault));
        staker.setRevenueDistributor(address(distributor));

        // 5. Register staker as revenue source (stream 1 = staking)
        distributor.registerSource(1, address(staker));

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("VaultStrategy:        ", address(vault));
        console.log("RevenueDistributor:   ", address(distributor));
        console.log("EnshrinedStaker:      ", address(staker));
    }
}
