const ethers = require('ethers')
const { Framework } = require('@superfluid-finance/sdk-core')
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

const {
  providerRPCURL,
  celoProviderUrl,
  chainID,
} = require('../settings/settings.js')
const ContractKit = require('@celo/contractkit')
const Stream = require('../models/Stream.js')

require('dotenv').config()

const web3 = new Web3(celoProviderUrl)

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

async function getSuperTokenBalance(req, res) {
  try {
    const user = req.user

    const currentUser = await User.findById(user.userId)

    const sf = await Framework.create({
      chainId: chainID,
      provider,
    })

    //   Initiate and get the super token
    const superToken = await sf.loadSuperToken('fDAIx')

    const balance = await superToken.balanceOf({
      account: currentUser.address,
      providerOrSigner: provider,
    })

    const convertedBalance = balance / 1e18

    return res.status(200).json({ success: true, response: convertedBalance })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, response: error })
  }
}

async function createPayStream(req, res) {
  try {
    const user = req.user

    const { reciever, recieverId, amount, duration } = req.body

    const currentUser = await User.findById(user.userId)
    // const currentUser = await User.findById(recieverId)

    // First convert the money to USD
    const amountConverted = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    const sf = await Framework.create({
      chainId: chainID,
      provider,
    })

    // Get the current user / payer passkey

    // Decrypt the passKey
    const privateKey = await decrypt(currentUser.passKey)

    //   Initiate and get the super token
    const superToken = await sf.loadSuperToken('fDAIx')

    const flowRateInPerSecond = await getFlowRate(amountConverted, duration) // Your original flow rate in per second

    // Convert the flow rate to wei per second by multiplying with 10^18
    const flowRateInWeiPerSecond = flowRateInPerSecond * 1e18

    // Convert the wei flow rate to a string
    const flowRate = flowRateInWeiPerSecond.toString()

    // Write operation example
    const signer = sf.createSigner({
      privateKey,
      provider,
    })

    const createFlowOperation = superToken.createFlow({
      sender: currentUser.address,
      receiver: reciever,
      flowRate: flowRate,
    })

    const txnResponse = await createFlowOperation.exec(signer)

    await txnResponse.wait()

    // Create stream table here...
    const stream = new Stream({
      from: currentUser.address,
      to: recieverId,
      amount: amountConverted,
      assert: 'fDAIx',
    })

    const txnReceipt = await stream.save()

    return res.status(200).json({ success: true, response: txnReceipt })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, response: error })
  }
}

async function getCurrentStream(req, res) {
  try {
    const { userId } = req.user

    const user = await User.findById(userId)

    const streamTo = await Stream.findOne({
      to: user._id,
    })

    const streamFrom = await Stream.findOne({
      from: user.address,
    })

    if (!streamFrom && !streamTo) {
      return res
        .status(200)
        .json({ success: false, response: 'You currently have no streams' })
    }

    const stream = streamTo ? streamTo : streamFrom

    return res.status(200).json({ success: true, response: stream })
  } catch (error) {
    return res.status(500).json({ success: false, response: error.message })
  }
}

async function getStreamFlow(req, res) {
  try {
    const { userId } = req.user

    const user = await User.findById(userId)

    const sf = await Framework.create({
      chainId: chainID,
      provider,
    })

    //   Initiate and get the super token
    const superToken = await sf.loadSuperToken('fDAIx')

    let result = await superToken.getFlow({
      sender: user.address,
      receiver: '0x4cc51cFd470E8Ce5fEccF9A2F4db9C624CfE3252',
      providerOrSigner: provider,
    })

    return res.status(200).json({
      success: true,
      response: result,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false })
  }
}

async function deletePayStream(req, res) {
  try {
    const user = req.user

    // const { reciever, amount, duration } = req.body

    const amount = 13.5
    const receiver = '0x4cc51cFd470E8Ce5fEccF9A2F4db9C624CfE3252'
    const duration = 'Day'

    const currentUser = await User.findById(user.userId)

    // First convert the money to USD
    const amountConverted = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    /*
    const sf = await Framework.create({
      chainId: chainID,
      provider,
    })

    // Get the current user / payer passkey

    // Decrypt the passKey
    const privateKey = await decrypt(currentUser.passKey)

    //   Initiate and get the super token
    const superToken = await sf.loadSuperToken('fDAIx')

    const flowRateInPerSecond = await getFlowRate(amountConverted, duration) // Your original flow rate in per second

    // Convert the flow rate to wei per second by multiplying with 10^18
    const flowRateInWeiPerSecond = flowRateInPerSecond * 1e18

    // Convert the wei flow rate to a string
    const flowRate = flowRateInWeiPerSecond.toString()

    // Write operation example
    const signer = sf.createSigner({
      privateKey,
      provider,
    })

    const createFlowOperation = superToken.deleteFlowByOperator({
      sender: currentUser.address,
      receiver: receiver,
      flowRate: flowRate,
    })

    const txnResponse = await createFlowOperation.exec(signer)

    const txnReceipt = await txnResponse.wait()

    */

    await Stream.findOneAndDelete({
      to: currentUser._id,
    })

    await Stream.findOneAndDelete({
      from: currentUser.address,
    })

    return res.status(200).json({ success: true, response: 'txnReceipt' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, response: error })
  }
}

const getFlowRate = (amount, rate) => {
  let flowRate
  if (rate === 'Month') {
    const secondsInAMonth = 30 * 24 * 60 * 60
    flowRate = amount / secondsInAMonth
    return flowRate.toFixed(6)
  }

  if (rate === 'Day') {
    const secondsInADay = 24 * 60 * 60
    flowRate = amount / secondsInADay
    return flowRate.toFixed(6)
  }
}

module.exports = {
  getSuperTokenBalance,
  createPayStream,
  getStreamFlow,
  deletePayStream,
  getCurrentStream,
}
