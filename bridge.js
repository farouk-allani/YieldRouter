import { MnemonicKey, Wallet, RESTClient, Msg, Int, Coins, Numeric } from '@initia/initia.js'
import { ethers } from 'ethers'

// Convert EVM private key to Initia Cosmos address
const evmPrivateKey = 'f8151ef722989650dc59db333425f2393d5ef487ccc491c3e15906c6193b94c7'
const evmWallet = new ethers.Wallet(evmPrivateKey)
console.log('EVM Address:', evmWallet.address)

// Convert to Initia (Cosmos) private key - same private key, coin type 118
const cosmosKey = new MnemonicKey({
  privateKey: Buffer.from(evmPrivateKey, 'hex'),
  coinType: 118
})
console.log('Cosmos Address:', cosmosKey.accAddress)

const L1_REST_URL = 'https://rest.testnet.initia.xyz'
const BRIDGE_ID = 1459
const AMOUNT = 100_000_000 // 0.1 INIT (uinit)

const restClient = new RESTClient(L1_REST_URL)
const wallet = new Wallet(cosmosKey, restClient)

async function bridgeToEVM() {
  try {
    console.log('Creating deposit tx...')
    
    // OPinit bridge deposit message
    const depositMsg = new Msg.MsgInitiateDeposit(
      cosmosKey.accAddress,
      BRIDGE_ID,
      'uinit',
      new Int(AMOUNT),
      evmWallet.address // EVM address as recipient (hex)
    )

    const tx = await wallet.createAndSignTx({
      msgs: [depositMsg],
      gasPrices: '0.015uinit',
      gasAdjustment: 1.5
    })

    console.log('Broadcasting tx...')
    const result = await restClient.tx.broadcast(tx)
    console.log('Tx hash:', result.txhash)
    console.log('Result:', result)

  } catch (error) {
    console.error('Error:', error)
  }
}

bridgeToEVM()
