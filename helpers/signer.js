const ethers = require('ethers')
const User = require('../models/User')
const { decrypt } = require('../security/encrypt')
const {
  bscProviderURL,
  celoProviderUrl,
  alfajoresRPC,
  celo,
  polygon,
  bnb,
} = require('../settings/settings')

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

const createSigner = async (userId, network) => {
  try {
    // let provider

    const currenctUser = await User.findById(userId)

    const privateKey = await decrypt(currenctUser.passKey)

    const provider = getProvider(network)

    const signer = await new ethers.Wallet(privateKey, provider)

    return signer
  } catch (error) {
    return error
  }
}

const getProvider = (network) => {
  switch (network) {
    case 'celo':
      return new ethers.providers.JsonRpcProvider(celo)

    case 'polygon':
      return new ethers.providers.JsonRpcProvider(polygon)

    case 'bnb':
      return new ethers.providers.JsonRpcProvider(bnb)

    // Main nets

    default:
      return new ethers.providers.JsonRpcProvider(celo)
  }
}

module.exports = {
  createSigner,
  getProvider,
}
