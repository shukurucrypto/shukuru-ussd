const { OneRamp } = require('oneramp')

const ethers = require('ethers')
const User = require('../models/User')
const { decrypt } = require('../security/encrypt')
const {
  oneRampClient,
  oneRampSecret,
  bscProviderURL,
  celoProviderUrl,
} = require('../settings/settings')
const { createSigner } = require('../helpers/signer')

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

async function getQuote(req, res) {
  try {
    const user = req.user

    const { amount, tokenAddress } = req.body

    const wallet = await createSigner(user.userId, 'celo')

    // Initialize oneramp here...
    const oneRamp = new OneRamp(
      'alfajores',
      oneRampClient,
      oneRampSecret,
      celoProvider,
      wallet
    )

    const quote = await oneRamp.quote(amount, tokenAddress)

    return res.status(200).json({
      response: quote,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      response: error,
    })
  }
}

module.exports = {
  getQuote,
}
