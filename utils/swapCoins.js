const ethers = require('ethers')
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
const { getSwapQuote } = require('./getSwapQuote.js')
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const swapCoins = async (userText, phoneNumber, swap) => {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    const swapAmount = ethers.utils.parseEther('0.50')

    if (!currentUser) {
      response = `END You do not have a wallet yet`
      return response
    }

    // Check to see if the user has enough ETH to swap
    if (swap === 'ETH/USDT') {
      const swapQuote = await getSwapQuote('ETH', 'USDT', swapAmount)
      const balance = await provider.getBalance(currentUser.address)
      userBalance = ethers.utils.formatEther(balance)

      //   console.log(`first balance is: ${userBalance}`)

      if (userBalance <= 0) {
        response = `END You do not have enough ETH to swap\n`
        return response
      } else {
        response = `END You have ${userBalance} ETH\n`
        response += `Performin swap...`
        return response
      }
    }

    // Check to see if the user has enough USDT to swap
    if (swap === 'USDT/ETH') {
      const swapQuote = await getSwapQuote('USDT', 'ETH', swapAmount)
      const userUsdtAsset = await Assets.findOne({
        user: currentUser._id,
        symbol: 'USDT',
      })

      if (userUsdtAsset.balance <= 0) {
        response = `END You do not have enough USDT to swap\n`
        return response
      } else {
        response = `END You have ${userUsdtAsset.balance} USDT\n`
        response += `Performin swap...`
        return response
      }
    }
  } catch (err) {
    response = `END An error occurred`
    console.log(err.message)
    return response
  }
}

module.exports = {
  swapCoins,
}
