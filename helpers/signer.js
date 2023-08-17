const ethers = require('ethers')
const User = require('../models/User')
const { decrypt } = require('../security/encrypt')
const {
  bscProviderURL,
  celoProviderUrl,
  oneRampClient,
  oneRampSecret,
} = require('../settings/settings')

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

const createSigner = async (userId, network) => {
  try {
    let provider

    const currenctUser = await User.findById(userId)

    const privateKey = await decrypt(currenctUser.passKey)

    if (network === 'celo') {
      provider = celoProvider
    } else {
      provider = provider
    }

    const signer = await new ethers.Wallet(privateKey, provider)

    return signer
  } catch (error) {
    return error
  }
}

const initialiseOneRamp = async (wallet, network) => {
  try {
    let provider

    // Initialize oneramp here...
    const oneRamp = new OneRamp(
      network,
      oneRampClient,
      oneRampSecret,
      celoProvider,
      wallet
    )

    return oneRamp
  } catch (error) {
    return error
  }
}

module.exports = {
  createSigner,
}
