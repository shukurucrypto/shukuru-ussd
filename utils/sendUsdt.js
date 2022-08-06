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
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const sendUsdt = async (userText, phoneNumber) => {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    if (!currentUser) {
      response = `END You do not have a wallet yet`
      return response
    }

    const userUsdtAsset = await Assets.findOne({
      user: currentUser._id,
      symbol: 'USDT',
    })

    if (userUsdtAsset.balance <= 0) {
      response = `END You do not have enough USDT to send\n`
      response += `You can swap USDT for ETH using the Shukuru swap coins`
      return response
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  sendUsdt,
  sendUsdt,
}
