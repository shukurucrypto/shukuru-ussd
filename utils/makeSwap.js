const Assets = require('../models/Assets.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
const { swapTokens } = require('../functions/swapTokens.js')
require('dotenv').config()

const makeSwap = async (tokenFrom, tokenTo, amount, phoneNumber) => {
  console.log('----------------------SWAPPING COINS CALLED--------------------')

  let response

  try {
    // get token from address from assets
    const tokenFromAsset = await Assets.findOne({ symbol: tokenFrom })

    const tokenToAsset = await Assets.findOne({ symbol: tokenTo })

    const signer = await getCurrentUserSigner(phoneNumber)

    let tokenFromObj = {
      name: tokenFromAsset.name,
      symbol: tokenFromAsset.symbol,
      address: tokenFromAsset.address.test,
      decimals: 18,
    }

    let tokenToObj = {
      name: tokenToAsset.name,
      symbol: tokenToAsset.symbol,
      address: tokenToAsset.address.test,
      decimals: 18,
    }

    await swapTokens(tokenFromObj, tokenToObj, amount, signer)

    return `END Swapping will go live on mainnet soon...`
  } catch (error) {
    response = `END An error occurred`
    console.log(error.message)
    return response
  }
}

module.exports = {
  makeSwap,
}
