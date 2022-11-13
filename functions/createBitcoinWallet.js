const bitcore = require('bitcore-lib')
const { ENVIRONMENT } = require('../settings/settings')
// const Mnemonic = require('bitcore-mnemonic')

const network = ENVIRONMENT === 'testnet' && ENVIRONMENT

const createBitcoinWallet = async () => {
  console.log('-------------GENERATE WALLET CALLED-----------')

  const privateKey = new bitcore.PrivateKey(network)
  const WIF = privateKey.toWIF()
  const address = privateKey.toAddress(network)

  return {
    address,
    privateKey,
    WIF,
  }
}

module.exports = {
  createBitcoinWallet,
}
