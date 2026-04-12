// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../test/mocks/MockERC20.sol";
import "../contracts/VaultStrategy.sol";
import "../contracts/RevenueDistributor.sol";
import "../contracts/EnshrinedStaker.sol";
import "../contracts/StrategyRouter.sol";

/**
 * @title DeployTestnet
 * @notice One-shot testnet deployment: deploys mock tokens + full YieldRouter system.
 *
 * Usage:
 *   forge script script/DeployTestnet.s.sol \
 *     --rpc-url https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz \
 *     --broadcast --legacy
 */
contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        // ── 1. Deploy mock tokens ────────────────────────────────────────
        MockERC20 iusd = new MockERC20("Initia USD", "IUSD", 18);
        MockERC20 lpToken = new MockERC20("INIT-IUSD LP", "INIT-IUSD-LP", 18);
        MockERC20 rewardToken = new MockERC20("Initia", "INIT", 18);

        // Mint initial supply to deployer
        iusd.mint(deployer, 1_000_000e18);
        lpToken.mint(deployer, 500_000e18);
        rewardToken.mint(deployer, 1_000_000e18);

        // ── 2. Deploy VaultStrategy ──────────────────────────────────────
        VaultStrategy vault = new VaultStrategy(
            address(iusd),
            10,   // maxStrategies
            500   // performanceFeeBps (5%)
        );

        // ── 3. Deploy RevenueDistributor ─────────────────────────────────
        RevenueDistributor distributor = new RevenueDistributor(
            address(iusd),
            1 hours, // harvestInterval
            300      // performanceFeeBps (3%)
        );

        // ── 4. Deploy EnshrinedStaker ────────────────────────────────────
        EnshrinedStaker staker = new EnshrinedStaker(
            address(lpToken),
            address(rewardToken),
            1 days // epochDuration
        );

        // ── 5. Deploy StrategyRouter ─────────────────────────────────────
        StrategyRouter router = new StrategyRouter(
            address(iusd),
            10,  // maxStrategies
            5,   // maxAllocations
            7    // maxRiskScore
        );

        // ── 6. Wire contracts together ───────────────────────────────────
        vault.setRevenueDistributor(address(distributor));

        distributor.setVault(address(vault));
        distributor.setKeeper(deployer);

        staker.setVault(address(vault));
        staker.setRevenueDistributor(address(distributor));

        router.setVault(address(vault));
        router.setEnshrinedStaker(address(staker));
        router.setRevenueDistributor(address(distributor));

        // ── 7. Register revenue sources ──────────────────────────────────
        distributor.registerSource(1, address(staker));

        // ── 8. Register strategies in the router ─────────────────────────
        router.registerStrategy(
            address(staker),
            "Enshrined LP (Initia Native)",
            StrategyRouter.ProtocolType.EnshrinedLP,
            2
        );

        // ── 9. Seed staker with reward tokens ────────────────────────────
        rewardToken.transfer(address(staker), 100_000e18);

        // ── 10. Register a validator on EnshrinedStaker ──────────────────
        staker.registerValidator(deployer, 500); // 5% commission

        vm.stopBroadcast();

        // ── Log deployed addresses ───────────────────────────────────────
        console.log("=== Mock Tokens ===");
        console.log("IUSD (asset):         ", address(iusd));
        console.log("INIT-IUSD-LP:         ", address(lpToken));
        console.log("INIT (reward):        ", address(rewardToken));
        console.log("");
        console.log("=== Core Contracts ===");
        console.log("VaultStrategy:        ", address(vault));
        console.log("RevenueDistributor:   ", address(distributor));
        console.log("EnshrinedStaker:      ", address(staker));
        console.log("StrategyRouter:       ", address(router));
        console.log("");
        console.log("Deployer:             ", deployer);
    }
}
