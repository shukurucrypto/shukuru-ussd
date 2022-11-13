const ethers = require('ethers')
const User = require('../models/User.js')
const sendSMS = require('../SMS/smsFunctions.js')
const bcrypt = require('bcrypt')
const { fundTestWallets } = require('./fundTestWallets.js')
const { truncateAddress } = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const { getBTCBalance } = require('../functions/getBTCBalance.js')
const Assets = require('../models/Assets.js')
const { getUsdtBalance } = require('./getUsdtBalance.js')
const { getLightningBalance } = require('../functions/getLightningBalance.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
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
      const signer = await getCurrentUserSigner(phoneNumber)

      const balance = await provider.getBalance(signer.address)

      // const btcBalance = await getBTCBalance(currentUser.btcAddress)
      const usdtBalance = await getUsdtBalance(phoneNumber)
      const lightningBalance = await getLightningBalance(phoneNumber)

      userBalance = ethers.utils.formatEther(balance)
      usdtUserBalance = ethers.utils.formatEther(usdtBalance)

      response = `END Shuku ${currentUser.name}, your wallet has:\n`
      response += ` ${Number(lightningBalance).toFixed(3)} BTC \n`
      response += ` ${Number(userBalance).toFixed(3)} ETH \n`
      response += ` ${Number(usdtBalance).toFixed(3)} USDT \n`
      response += ` ${0.0} cUSD \n`

      const btcUserAsset = await Assets.findOneAndUpdate(
        {
          user: currentUser._id,
          symbol: 'BTC',
        },
        { balance: lightningBalance }
      )

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
}

module.exports = {
  walletBalance,
}
