const ethers = require('ethers')
const User = require('../models/User.js')
const sendSMS = require('../SMS/smsFunctions.js')
const bcrypt = require('bcrypt')
const { fundTestWallets } = require('./fundTestWallets.js')
const { truncateAddress } = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
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

      // console.log(`first balance is: ${balance}`)

      userBalance = ethers.utils.formatEther(balance)
      // update the wallet balance in the db
      currentUser.balance = userBalance
      await currentUser.save()

      await sendSMS(
        `Your wallet ${truncateAddress(
          currentUser.address
        )} balance is ${userBalance} ETH`,
        phoneNumber
      )

      response = `END Your wallet balance has: ${userBalance} ETH`
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
