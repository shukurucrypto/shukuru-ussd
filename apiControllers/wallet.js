const ethers = require('ethers')
const CC = require('currency-converter-lt')
const User = require('../models/User')
const Transaction = require('../models/Transaction.js')
const {
  providerRPCURL,
  busdAddress,
  bscProviderURL,
} = require('../settings/settings')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner')
const { getUsdtBalance } = require('../utils/getUsdtBalance')
const {
  getLightningBalance,
  getSatsLightningBalance,
} = require('../functions/getLightningBalance')

const BUSDABI = require('../abiData/erc20.json')
const { getCelloDollarBalance } = require('../utils/getCelloDollarBalance')
const UserTransactions = require('../models/UserTransactions')
const { currencyConvertor } = require('../utils/currencyConvertor')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)

async function getApiProfileTx(req, res) {
  try {
    const userId = req.params.userId

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ response: 'User not found' })
    }

    const txTo = await UserTransactions.findOne({ user: userId }).populate({
      path: 'transactions',
      options: { sort: { date: 'desc' } },
    })

    return res.status(200).json({
      success: true,
      data: txTo,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function getApiProfile(req, res) {
  try {
    const phone = req.params.phone

    const user = await User.findOne({ phoneNumber: phone })

    if (!user) {
      return res.status(404).json({ response: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    res.status(500).json(error.message)
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      data: currentUser,
    })
  } catch (error) {
    res.status(404).json(error.message)
  }
}

async function getWalletApiBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const phoneNumber = currentUser.phoneNumber

    // const signer = await getCurrentUserSigner(phoneNumber)

    // const balance = await provider.getBalance(signer.address)

    // let lightningBalance = 0

    // const btcBalance = await getBTCBalance(currentUser.btcAddress)
    // let usdtBalance = await getUsdtBalance(phoneNumber)
    // let btcLightningBalance = await getLightningBalance(phoneNumber)

    const busdContract = new ethers.Contract(busdAddress, BUSDABI, provider)

    let convertedCello = 0
    let convertedBusd = 0
    let sats = await getSatsLightningBalance(phoneNumber)
    let celloDollarBalance = await getCelloDollarBalance(phoneNumber)
    celloDollarBalance_ = ethers.utils.formatEther(celloDollarBalance)

    const busdWalletBalance = await busdContract.balanceOf(currentUser.address)

    // const userBalance = ethers.utils.formatEther(balance)
    // const usdtUserBalance = ethers.utils.formatEther(usdtBalance)

    // IMPORTANT LINES ------- Coversion lines
    if (Number(celloDollarBalance_) > 0) {
      convertedCello = await currencyConvertor(
        celloDollarBalance_,
        'USD',
        currentUser.country
      )
    }

    if (Number(busdWalletBalance) > 0) {
      convertedBusd = await currencyConvertor(
        ethers.utils.formatEther(busdWalletBalance.toString()),
        'USD',
        currentUser.country
      )
    }

    // if (btcLightningBalance > 0) {
    //   lightningBalance = await currencyConvertor(
    //     sats,
    //     'USD',
    //     currentUser.country
    //   )
    // }

    const total = Number(convertedCello) + Number(convertedBusd) + sats
    // Number(convertedCello) + Number(userBalance) + Number(usdtBalance)
    // Number(lightningBalance) +

    return res.status(200).json({
      success: true,
      data: {
        userId: currentUser._id,
        lightning: sats,
        cusd: Number(celloDollarBalance_),
        // eth: Number(userBalance),
        // usdt: Number(usdtBalance),
        busd: Number(convertedBusd),
        eth: 0,
        usdt: 0,
        total: total,
      },
    })
  } catch (error) {
    res.status(500).json(error.message)
  }
}

const currencyConvertorApi = async (req, res) => {
  let convertedAmount = 0
  try {
    const { amount, from, to } = req.body

    if (Number(amount) <= 0) {
      return res.status(404).json({ response: 'Please enter a valid amount' })
    }

    let currencyConverter = new CC({
      from: from,
      to: to,
      amount: Number(amount),
    })

    await currencyConverter.convert(Number(amount)).then((response) => {
      convertedAmount = response
    })

    return res.status(200).json({
      success: true,
      data: convertedAmount.toString(),
    })
  } catch (error) {
    // console.log(error.response)
    return res.status(500).json({
      success: false,
    })
  }
}

module.exports = {
  getWalletApiBalance,
  getProfile,
  getApiProfile,
  getApiProfileTx,
  currencyConvertorApi,
}
