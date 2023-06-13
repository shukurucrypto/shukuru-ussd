const ethers = require('ethers')
const User = require('../models/User.js')
const Assets = require('../models/Assets.js')
const UserTransactions = require('../models/UserTransactions.js')

const { currencyConvertor } = require('../utils/currencyConvertor.js')
const Web3 = require('web3')
const Redis = require('redis')
const { encrypt, decrypt } = require('../security/encrypt.js')
const {
  getCreateUserWalletInfo,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const jwt = require('jsonwebtoken')

const passport = require('passport-local')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  providerRPCURL,
  celoProviderUrl,
  bscProviderURL,
} = require('../settings/settings.js')
const { createBitcoinWallet } = require('../functions/createBitcoinWallet.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { createLightningWallet } = require('../lightning/createWallet.js')
const LightningWallet = require('../models/LightningWallet.js')
const { getUserCurrency } = require('../functions/getUserCurrency.js')
const { newSignup } = require('../sockets/sockets.js')
const Rewards = require('../models/Rewards.js')
const Transaction = require('../models/Transaction.js')
const ContractKit = require('@celo/contractkit')

require('dotenv').config()

const redisClient = Redis.createClient()
const DEFAULT_REDIS_EXPIRATION = 36000

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

async function sendReward(req, res) {
  try {
    const user = req.user

    const { receivers, asset, amount } = req.body

    const admin = await User.findById(user.userId)

    if (!admin) {
      return res.status(403).json({ success: false })
    }

    if (admin.accountType != 'Admin') {
      return res.status(403).json({ success: false })
    }

    // Loop through them and send them their rewards each

    receivers.forEach(async (item) => {
      //   const awardReciever = await User.findById(item)

      //   Send the rewards to their wallets

      // Send Reward tranasction to them -n .
      //      - Create a Reward model for them first
      const rewardModal = await Rewards.findOne({ receiver: item })

      if (!rewardModal) {
        const newReward = new Rewards({
          receiver: item,
          amount: amount,
          asset: asset,
        })

        await newReward.save()
      } else {
        rewardModal.claimed = false
        rewardModal.amount = amount
        rewardModal.asset = asset

        await rewardModal.save()
      }
    })

    return res.status(200).json({
      receivers,
      amount,
      asset,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, response: error.message })
  }
}

async function claimReward(req, res) {
  try {
    const user = req.user

    //   Get the reward table
    const reward = await Rewards.findOne({ receiver: user.userId })

    if (!reward) {
      return res
        .status(403)
        .json({ success: false, response: 'You have no rewards this week' })
    }

    // validate to see if the awards aren't already claimed
    if (reward.claimed) {
      return res
        .status(403)
        .json({ success: false, response: 'Reward already claimed' })
    }

    // validate to see if the awards is not yet expired
    const expired = reward.expires > new Date()

    if (expired) {
      return res.status(404).json({ response: 'Reward  has expired' })
    }

    // Send the rewards Tx here....
    const rewardResponse = await sendCUSDReward(
      reward.amount,
      user.userId,
      reward.asset
    )

    if (rewardResponse.success) {
      // Change the reward claimed to true
      reward.claimed = true
      await reward.save()
    }

    return res.status(200).json(rewardResponse)
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, response: error.message })
  }
}

async function sendCUSDReward(amount, to, asset) {
  try {
    const reciever = await User.findById(to)

    if (!reciever) {
      return {
        success: false,
        response: 'The User does not have a Shukuru Wallet',
      }
    }

    let cUSDtoken = await kit.contracts.getStableToken()

    // This lines will convert the cUSD balance from the user's local currency back to USD
    const convertedToUSDAmount = await currencyConvertor(
      amount,
      //   sender.country,
      'UGX',
      'USD'
    )

    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // Decrypt the passKey
    const privateKey = process.env.PRIVATE_KEY
    const adminAddress = process.env.ADMIN_ADDRESS

    // tx object
    await kit.connection.addAccount(privateKey)

    // get wallet balance
    const walletBalance = await cUSDtoken.balanceOf(adminAddress)

    const convertedBalance = await ethers.utils.formatEther(
      walletBalance.toString()
    )

    if (Number(convertedBalance) === 0.0 || Number(convertedBalance) === 0) {
      return { response: 'Insufficent cUSD balance' }
    }

    // SENDING
    const result = await cUSDtoken
      .transfer(reciever.address, amount_)
      .send({ from: adminAddress })

    let txRecipt = await result.waitReceipt()

    if (!txRecipt.status) {
      return { success: false, response: 'Transaction failed!' }
    }

    // Create TX Objects here...
    const receiverTx = await new Transaction({
      receiver: reciever._id,
      currency: reciever.country,
      asset: asset,
      amount: amount,
      txType: 'reward',
      phoneNumber: reciever.phoneNumber,
    })

    const toTx = await receiverTx.save()

    const receiverTxs = await UserTransactions.findOne({
      user: toTx.receiver,
    })

    await receiverTxs.transactions.push(toTx._id)

    await receiverTxs.save()

    return {
      success: true,
      data: txRecipt,
      tx: toTx,
    }
  } catch (error) {
    console.log(error.message)
    return {
      success: false,
      response: error.message,
    }
  }
}

async function checkReward(req, res) {
  try {
    const user = req.user

    //   Get the reward table
    const reward = await Rewards.findOne({ receiver: user.userId })

    if (!reward) {
      return res
        .status(403)
        .json({ success: false, response: 'You have no rewards this week' })
    }

    // validate to see if the awards aren't already claimed
    if (reward.claimed) {
      return res.status(403).json({ success: false, response: reward })
    }

    // Validate to see the expiry date of the award
    // const rewardToClaim = await Rewards.findOne({
    //   receiver: user.userId,
    //   claimed: false,
    //   expires: { $gt: new Date() },
    // })

    const expired = reward.expires > new Date()

    return res.status(200).json({
      success: true,
      response: reward,
      expired: expired,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

module.exports = {
  sendReward,
  claimReward,
  checkReward,
}
