import { MnemonicKey } from '@initia/initia.js'
import { Wallet } from 'ethers'

const evmPrivateKey = 'f8151ef722989650dc59db333425f2393d5ef487ccc491c3e15906c6193b94c7'
const evmWallet = new Wallet(evmPrivateKey)
console.log('EVM Address:', evmWallet.address)

const cosmosKey = new MnemonicKey({
  privateKey: Buffer.from(evmPrivateKey, 'hex'),
  coinType: 118
})
console.log('Cosmos (L1) Address:', cosmosKey.accAddress)
