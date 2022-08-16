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
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const getSwapQuote = async (tokenFrom, tokenTo, amount) => {
  let response

  let tradeFrom, tradeTo, tradeToAddress, tradeFromAddress

  console.log('----------------------CALLED--------------------')

  //   We need to validate that none of the swap coins is ETH because ethereum doesnot have a smart contract address,
  //   therefore coingeko won't return the ETH data because it does not have it
  if (tokenFrom != 'ETH') {
    const fromToken = await getCoin(tokenFrom)
    tradeFrom = fromToken
    tradeFromAddress = fromToken.address
  } else {
    tradeFromAddress = tokenFrom
  }

  if (tokenTo != 'ETH') {
    const toToken = await getCoin(tokenTo)
    tradeTo = toToken
    tradeToAddress = toToken.address
  } else {
    tradeToAddress = tokenTo
  }

  //   const convertedAmount = amount * 10 ** tokenFrom.decimals
  const params = {
    sellToken: tradeFromAddress,
    buyToken: tradeToAddress,
    sellAmount: amount.toString(),
  }

  try {
    await axios
      .get(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`)
      .then((res) => {
        const quote = res.data
        return quote
      })
      .catch((err) => {
        console.log(err.message)
      })
  } catch (error) {
    response = `END An error occurred`
    console.log(error.message)
    return response
  }
}

module.exports = {
  getSwapQuote,
}
