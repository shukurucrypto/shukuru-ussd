const ethers = require('ethers')
const User = require('../models/User.js')
const sendSMS = require('../SMS/smsFunctions.js')
const bcrypt = require('bcrypt')
const { fundTestWallets } = require('./fundTestWallets.js')
const { truncateAddress } = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const { getBTCBalance } = require('../functions/getBTCBalance.js')
const Assets = require('../models/Assets.js')
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

async function walletBalance(phoneNumber) {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    let userBalance

    // await fundTestWallets(currentUser.address); // uncomment this to fund test wallet

    if (currentUser) {
      const balance = await provider.getBalance(currentUser.address)
      const btcBalance = await getBTCBalance(currentUser.btcAddress)

      const btcBalanceConverted =
        btcBalance.data.confirmed_balance > 0
          ? btcBalance.data.confirmed_balance
          : btcBalance.data.unconfirmed_balance

      // Find btc asset and update balance
      const btcUserAsset = await Assets.findOneAndUpdate(
        {
          user: currentUser._id,
          symbol: 'BTC',
        },
        { balance: btcBalanceConverted }
      )

      userBalance = ethers.utils.formatEther(balance)

      // update the wallet balance in the db

      // btcUserAsset.balance = btcBalance

      await sendSMS(
        `Your wallet ${truncateAddress(currentUser.address)} balance:\n 
          ${userBalance} ETH\n
          ${btcBalanceConverted} BTC`,
        phoneNumber
      )

      response = `END Shuku ${currentUser.name}, Your wallet has:\n`
      response += ` ${btcBalanceConverted} BTC \n`
      response += ` ${userBalance} ETH \n`
      response += ` 0.0 USDT \n`

      if (currentUser.balance !== userBalance) {
        currentUser.balance = userBalance
        btcUserAsset.balance = balance

        currentUser.save()
        btcUserAsset.save()
      }

      return response
    } else {
      response = `END You do not have a wallet yet`
      return response
    }
  } catch (err) {
    response = `END An error occurred`
    return response
  }
  // get user from the database
}

module.exports = {
  walletBalance,
}
