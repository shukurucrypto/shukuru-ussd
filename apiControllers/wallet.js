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

const Redis = require('redis')
const BUSDABI = require('../abiData/erc20.json')
const { getCelloDollarBalance } = require('../utils/getCelloDollarBalance')
const UserTransactions = require('../models/UserTransactions')
const {
  currencyConvertor,
  satsConvertor,
} = require('../utils/currencyConvertor')
const AccountSecrets = require('../models/AccountSecrets')
const ActiveInvoice = require('../models/ActiveInvoice')
const LightningWallet = require('../models/LightningWallet')
const NfcCard = require('../models/NfcCard')
const { boltGETRequest } = require('../helpers/boltRequests')
const { cacheUserTxs } = require('../redis/txcache.js')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)

// const redisClient = Redis.createClient()

const DEFAULT_REDIS_EXPIRATION = 36000

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

    // await cacheUserTxs(userId, txTo)

    return res.status(200).json({
      success: true,
      data: txTo,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function getApiProfileUsername(req, res) {
  try {
    const name = req.params.name

    const cleaned = name.replace(/\s+/g, '')

    const user = await User.findOne({ name: cleaned })

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

    // Create a cleaned version of the user object
    const cleanedUser = {
      // Include only the non-sensitive data
      name: currentUser.name,
      email: currentUser.email,
      country: currentUser.country,
      accountType: currentUser.accountType,
      verified: currentUser.verified,
      balance: currentUser.balance,
      address: currentUser.address,
      btcBalance: currentUser.btcBalance,
      // Optionally include other fields that are considered safe
    }

    return res.status(200).json({
      success: true,
      data: cleanedUser,
    })
  } catch (error) {
    res.status(404).json(error.message)
  }
}

async function getBTCAPIBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const phoneNumber = currentUser.phoneNumber

    let sats = await getSatsLightningBalance(phoneNumber)

    const convertedSats = await satsConvertor(sats, currentUser.country)

    return res.status(200).json({
      success: true,
      data: convertedSats,
    })
  } catch (error) {
    return res.status(500).json({ success: false, response: error.message })
  }
}

async function changeUserCurrencyAPI(req, res) {
  try {
    const { country } = req.body

    const { userId } = req.user

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        response: 'User does not exist',
      })
    }

    // Change the user currency here
    user.country = country

    await user.save()

    // Update the user's currency in the cache
    await redisClient.setex(
      `user:${userId}`,
      DEFAULT_REDIS_EXPIRATION,
      JSON.stringify(user)
    )

    return res.status(201).json({
      success: true,
      data: user,
    })
  } catch (error) {
    return res.status(500).json({ success: false, response: error.message })
  }
}

async function getWalletApiBalance(req, res) {
  try {
    const { userId } = req.user

    const currentUser = await User.findById(userId)

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const phoneNumber = currentUser.phoneNumber

    let convertedCello = 0

    let celloDollarBalance = await getCelloDollarBalance(phoneNumber)
    celloDollarBalance_ = ethers.utils.formatEther(celloDollarBalance)

    // IMPORTANT LINES ------- Coversion lines
    if (Number(celloDollarBalance_) > 0) {
      convertedCello = await currencyConvertor(
        celloDollarBalance_,
        'USD',
        currentUser.country
      )
    }

    let sats

    // Call bolt to get the user wallet balances here...
    const boltInstance = await boltGETRequest(null, req.bolt, '/users')

    if (!boltInstance.success) {
      sats = 0.0
    }

    sats = boltInstance.response.wallet.balance

    const convertedSats = await satsConvertor(sats, currentUser.country)

    let total

    if (!convertedSats && typeof convertedSats !== Number) {
      total = Number(convertedCello)
    } else {
      total = Number(convertedCello) + convertedSats
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: currentUser._id,
        lightning: sats,
        cusd: Number(celloDollarBalance_),
        busd: 0,
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

const currencyConvertorToEthersApi = async (req, res) => {
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

    const bigAmount = ethers.utils.parseEther(convertedAmount.toString())

    return res.status(200).json({
      success: true,
      // data: bigAmount.toString(),
      data: convertedAmount,
    })
  } catch (error) {
    // console.log(error.response)
    return res.status(500).json({
      success: false,
    })
  }
}

async function clearAllTransactions(req, res) {
  try {
    const { userId } = req.user

    const allTx = await UserTransactions.findOneAndUpdate({
      user: userId,
      $set: { transactions: [] },
    })

    await allTx.save()

    // Delete all the saved TXs
    // await Transaction.deleteMany({
    //   receiver: userId,
    // })

    // await Transaction.deleteMany({
    //   sender: userId,
    // })

    return res.status(204).json({
      success: true,
      response: 'Removed!',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

async function getBUSDWalletApiBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const busdContract = new ethers.Contract(busdAddress, BUSDABI, provider)

    const busdWalletBalance = await busdContract.balanceOf(currentUser.address)

    let convertedBusd = 0.0

    if (Number(busdWalletBalance) > 0) {
      convertedBusd = await currencyConvertor(
        ethers.utils.formatEther(busdWalletBalance.toString()),
        'USD',
        currentUser.country
      )
    }

    return res.status(200).json({
      success: true,
      data: Number(convertedBusd),
    })
  } catch (error) {
    res.status(500).json(error.message)
  }
}

async function getRawCUSDWalletApiBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const phoneNumber = currentUser.phoneNumber

    let celloDollarBalance = await getCelloDollarBalance(phoneNumber)
    celloDollarBalance_ = ethers.utils.formatEther(celloDollarBalance)

    // IMPORTANT LINES ------- Coversion lines
    if (Number(celloDollarBalance_) > 0) {
      convertedCello = await currencyConvertor(
        celloDollarBalance_,
        'USD',
        currentUser.country
      )
    }

    return res.status(200).json({
      success: true,
      data: Number(celloDollarBalance_),
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

async function deleteUserAccount(req, res) {
  try {
    const { userId } = req.user

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        response: 'Not authorized to this action!',
      })
    }

    // Start deleting data...
    await AccountSecrets.findOneAndDelete({ user: userId })
    await LightningWallet.findOneAndDelete({
      user: userId,
    })

    await NfcCard.findOneAndDelete({ user: userId })
    await User.findByIdAndDelete(userId)

    return res.status(204).json({
      success: true,
      response: 'Removed!',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error.message,
    })
  }
}

// async function getBUSDWalletApiBalance(req, res) {
//   try {
//     const userId = req.params.userId

//     const currentUser = await User.findById(userId)

//     // let userBalance

//     if (!currentUser) {
//       return res.status(404).json({ response: 'User not found' })
//     }

//     const busdContract = new ethers.Contract(busdAddress, BUSDABI, provider)

//     const busdWalletBalance = await busdContract.balanceOf(currentUser.address)

//     if (Number(busdWalletBalance) > 0) {
//       convertedBusd = await currencyConvertor(
//         ethers.utils.formatEther(busdWalletBalance.toString()),
//         'USD',
//         currentUser.country
//       )
//     }

//     return res.status(200).json({
//       success: true,
//       data: Number(convertedBusd),
//     })
//   } catch (error) {
//     res.status(500).json(error.message)
//   }
// }

async function getRawCUSDWalletApiBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    const phoneNumber = currentUser.phoneNumber

    let celloDollarBalance = await getCelloDollarBalance(phoneNumber)
    celloDollarBalance_ = ethers.utils.formatEther(celloDollarBalance)

    // IMPORTANT LINES ------- Coversion lines
    if (Number(celloDollarBalance_) > 0) {
      convertedCello = await currencyConvertor(
        celloDollarBalance_,
        'USD',
        currentUser.country
      )
    }

    return res.status(200).json({
      success: true,
      data: Number(celloDollarBalance_),
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

async function getApiBTCTxs(req, res) {
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

    // Filter transactions with asset: 'Lightning' only
    const lightningTransactions = txTo.transactions.filter((transaction) => {
      return transaction.asset === 'Lightning'
    })

    return res.status(200).json({
      success: true,
      data: lightningTransactions,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function getBTCWalletApiBalance(req, res) {
  try {
    const userId = req.params.userId

    const currentUser = await User.findById(userId)

    // let userBalance

    if (!currentUser) {
      return res.status(404).json({ response: 'User not found' })
    }

    let sats
    // Call bolt to get the user wallet balances here...
    const boltInstance = await boltGETRequest(null, req.bolt, '/users')

    if (!boltInstance.success) return (sats = 0.0)

    sats = boltInstance.response.wallet.balance

    const convertedSats = await satsConvertor(sats, currentUser.country)

    const total = convertedSats

    return res.status(200).json({
      success: true,
      data: {
        userId: currentUser._id,
        lightning: convertedSats,
        cusd: 0,
        busd: 0,
        eth: 0,
        usdt: 0,
        total: total,
      },
    })
  } catch (error) {
    res.status(500).json(error.message)
  }
}

module.exports = {
  getWalletApiBalance,
  getProfile,
  getApiProfile,
  getApiProfileTx,
  currencyConvertorApi,
  getApiProfileUsername,
  getBTCAPIBalance,
  changeUserCurrencyAPI,
  deleteUserAccount,
  currencyConvertorToEthersApi,
  getBUSDWalletApiBalance,
  getRawCUSDWalletApiBalance,
  clearAllTransactions,
  getApiBTCTxs,
  getBTCWalletApiBalance,
}
