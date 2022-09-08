const ethers = require('ethers')
const qs = require('qs')
const axios = require('axios')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const Assets = require('../models/Assets.js')
const { getCoin } = require('../apiCalls/getCoin.js')
const { erc20Contract } = require('../abiData/abiData.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
const { swapTokens } = require('../functions/swapTokens.js')
// const { useUniswapTokens } = require('../functions/swapTokensWithUniswap.js')
// const { swapTokens } = require('../functions/swapTokens.js')
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
