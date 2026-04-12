#!/usr/bin/env bash
# YieldRouter — One-click Testnet Deployment
# Usage: ./script/deploy-testnet.sh
#
# Prerequisites:
#   1. Set PRIVATE_KEY in .env (hex, no 0x prefix)
#   2. Fund the wallet with testnet INIT via https://app.testnet.initia.xyz/faucet
#   3. Bridge INIT to EVM rollup via Initia Bridge

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

RPC_URL="${RPC_URL:-https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz}"

if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "ERROR: PRIVATE_KEY not set. Create .env with your private key."
  exit 1
fi

echo "========================================="
echo "  YieldRouter Testnet Deployment"
echo "========================================="
echo "RPC:     $RPC_URL"
echo "Chain:   Initia EVM Testnet (evm-1)"
echo ""

# Check balance
DEPLOYER=$(cast wallet address "$PRIVATE_KEY" 2>/dev/null || echo "unknown")
echo "Deployer: $DEPLOYER"
BALANCE=$(cast balance "$DEPLOYER" --rpc-url "$RPC_URL" 2>/dev/null || echo "0")
echo "Balance:  $BALANCE"
echo ""

if [ "$BALANCE" = "0" ]; then
  echo "WARNING: Wallet reports 0 balance. Attempting deployment anyway..."
  echo "If this fails, you will need to wait for faucet funds to confirm"
fi

echo "Deploying contracts..."
echo ""

forge script script/DeployTestnet.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --legacy \
  -vvv

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Update src/lib/contracts.ts with the addresses above."
echo "Explorer: https://scan.testnet.initia.xyz/evm-1"
