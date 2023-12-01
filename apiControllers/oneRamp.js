const { OneRamp } = require('@oneramp/sdk')
const ethers = require('ethers')
const User = require('../models/User')
const { decrypt } = require('../security/encrypt')
const {
  oneRampClient,
  oneRampSecret,
  bscProviderURL,
  celoProviderUrl,
  mumbaiProvider,
} = require('../settings/settings')
const { createSigner, getProvider } = require('../helpers/signer')
const Transaction = require('../models/Transaction')
const { sendPush } = require('./alerts')
const UserTransactions = require('../models/UserTransactions')

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)
const polygonMumbaiProvider = new ethers.providers.JsonRpcProvider(
  mumbaiProvider
)

async function getQuote(req, res) {
  try {
    const user = req.user

    const { amount, asset, network } = req.body

    const wallet = await createSigner(user.userId, network)

    // Initialize oneramp here...
    const oneRamp = new OneRamp(
      'celo',
      oneRampClient,
      oneRampSecret,
      celoProvider,
      wallet
    )

    const quote = await oneRamp.quote(amount, asset)

    return res.status(200).json({
      success: true,
      response: quote,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error,
    })
  }
}

async function withdrawCUSD(req, res) {
  try {
    const user = req.user

    const { amount, tokenAddress, phoneNumber, asset, network } = req.body

    const wallet = await createSigner(user.userId, network) // <-- Change to the asset

    // Initialize oneramp here...

    const oneRamp = new OneRamp(
      'celo', /// <-- Change to celo
      oneRampClient,
      oneRampSecret,
      celoProvider, /// <--- Change the provider to celo
      wallet
    )

    const oneRampRezz = await oneRamp.offramp(
      'stable',
      Number(amount),
      phoneNumber
    )
    console.log('====================================')
    console.log(oneRampRezz)
    console.log('====================================')

    const { success, response } = oneRampRezz

    // if (!success) {
    //   return res
    //     .status(401)
    //     .json({ success: false, response: 'Transaction failed!' })
    // }

    const newTx = new Transaction({
      sender: user.userId,
      txHash: response.txHash,
      asset: asset,
      amount: response.fiat,
      currency: user.country,
      txType: 'withdraw',
      phoneNumber: response.phone,
      external: true,
    })

    const saved = await newTx.save()

    const userTx = await UserTransactions.findOne({ user: user.userId })

    await userTx.transactions.push(saved._id)

    await userTx.save()

    return res.status(200).json({
      success: true,
      response: response,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      response: error,
    })
  }
}

async function confirmedTxCallback(req, res) {
  try {
    const { txHash } = req.body

    const activeTx = await Transaction.findOne({ txHash: txHash })

    if (!activeTx) {
      return res
        .status(404)
        .json({ success: false, response: 'Transaction not found!' })
    }

    activeTx.status = 'DONE'

    activeTx.save()

    const user = await User.findById(activeTx.sender)

    const data = {
      name: 'PAYOUT',
      msg: `🎉 Your ${user.country} ${Number(activeTx.amount).toFixed()} (${
        activeTx.asset
      }) withdraw has been sent to your ${
        activeTx.phoneNumber
      } mobile money! 😌`,
    }

    // const { user, msg, name } = req.body

    // const targetedUser = await User.findOne({ name: user })

    // if (!targetedUser) {
    //   return res
    //     .status(404)
    //     .json({ success: false, response: 'User not found' })
    // }

    // const result = await sendPush(targetedUser._id, msg, name)

    // Send the user a push notification
    const result = await sendPush(activeTx.sender, data.msg, data.name)

    return res.status(200).json({ success: true, response: result })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, response: error })
  }
}

module.exports = {
  getQuote,
  withdrawCUSD,
  confirmedTxCallback,
}
