const ContractKit = require('@celo/contractkit')
const {
  providerRPCURL,
  celoProviderUrl,
  bscProviderURL,
  busdAddress,
} = require('../settings/settings.js')

const Web3 = require('web3')
const ethers = require('ethers')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const {
  createLightingInvoice,
} = require('../lightning/createLightningInvoice.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { sendBitcoinTx } = require('../functions/sendBitcoinTx.js')
const LightningWallet = require('../models/LightningWallet.js')
const { payLightingInvoice } = require('../lightning/payLightingInvoice.js')
const { getLightningWalletBalance } = require('../lightning/walletBalance.js')
const {
  createBTCPlatformTxFeeInvoice,
  platformPayoutFeeAmount,
} = require('../platformPayout/platformPayout.js')
const UserTransactions = require('../models/UserTransactions.js')
const {
  decodeLightningInvoice,
} = require('../lightning/decodeLightningInvoice.js')
const { currencyConvertor } = require('../utils/currencyConvertor.js')
const {
  getLightningWalletTransactions,
} = require('../lightning/getWalletTransactions.js')
const { invoiceStatus } = require('../lightning/invoiceStatusHash.js')
const ActiveInvoice = require('../models/ActiveInvoice.js')
const BUSDABI = require('../abiData/erc20.json')
const NfcCard = require('../models/NfcCard.js')
const { log } = require('console')

require('dotenv').config()

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)

const getInvoiceStatusAPI = async (req, res) => {
  try {
    const { userId, hash } = req.body

    const currentUser = await User.findById(userId)

    const { inKey: recieverKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the inKey
    const keyReciever = await decrypt(recieverKey)

    // const invoiceResponse = await decodeLightningInvoice(keyReciever, data)
    const invoiceResponse = await invoiceStatus(keyReciever, hash)

    if (invoiceResponse) {
      return res.status(201).json({
        success: true,
        data: invoiceResponse,
      })
    } else {
      return res.status(404).json({
        success: false,
        data: 'Invoice does not exist',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const decodeInvoiceAPI = async (req, res) => {
  try {
    const { userId, invoice } = req.body

    const currentUser = await User.findById(userId)

    const { inKey: recieverKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the inKey
    const keyReciever = await decrypt(recieverKey)

    // Create the invoice from the reciever
    const data = {
      data: invoice,
    }

    // const invoiceResponse = await createLightingInvoice(keyReciever, data)
    const invoiceResponse = await decodeLightningInvoice(keyReciever, data)

    if (invoiceResponse.payment_hash) {
      return res.status(201).json({
        success: true,
        data: {
          hash: invoiceResponse.payment_hash,
          amount: invoiceResponse.amount_msat,
          memo: invoiceResponse.description,
          date: invoiceResponse.date,
          expiry: invoiceResponse.expiry,
        },
      })
    } else {
      return res.status(404).json({
        success: false,
        data: 'Failed to create invoice',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const createAPILightningInvoice = async (req, res) => {
  try {
    const { userId, amount, memo } = req.body

    const currentUser = await User.findById(userId)

    const { inKey: recieverKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the inKey
    const keyReciever = await decrypt(recieverKey)

    // Create the invoice from the reciever
    const data = {
      out: false,
      amount: amount,
      memo: `${currentUser.name} invoice for payment: ${memo}`,
      unit: currentUser.country,
    }

    const invoiceResponse = await createLightingInvoice(keyReciever, data)

    if (invoiceResponse?.payment_hash) {
      return res.status(201).json({
        success: true,
        data: invoiceResponse.payment_request,
        request: invoiceResponse.payment_hash,
      })
    } else {
      return res.status(404).json({
        success: false,
        data: 'Failed to create invoice',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const getBTCWalletTransactionsAPI = async (req, res) => {
  try {
    const userId = req.params.userId

    const sender = await User.findById(userId)

    const { adminKey, walletId } = await LightningWallet.findOne({
      user: sender._id,
    })

    const result = await getLightningWalletTransactions(walletId)

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

const nfcPayBUSDAPI = async (req, res) => {
  try {
    const { tagNo, invoice, to, amount } = req.body

    const currencyUser = req.user

    const nfcCard = await NfcCard.findOne({ tagNo: tagNo })

    if (!nfcCard) {
      return res
        .status(404)
        .json({ success: false, response: 'Card not found' })
    }

    if (currencyUser.userId === nfcCard.user) {
      return res.status(400).json({
        success: false,
        response: 'Self payments are not permitted',
      })
    }

    const sender = await User.findById(nfcCard.user)

    if (!sender) {
      return res
        .status(404)
        .json({ success: false, response: 'User does not exist' })
    }

    if (!invoice) {
      return res
        .status(403)
        .json({ success: false, response: 'Please enter a valid invoice' })
    }

    const reciever = await User.findById(to)

    if (!reciever) {
      return res
        .status(404)
        .json({ response: 'The User does not have a Shukuru Wallet' })
    }

    // Get the current user / payer passkey
    const dbPrivateKey = sender.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // Get the reciever's address from db
    const recieverAddress = reciever.address

    const convertedToUSDAmount = await currencyConvertor(
      amount,
      sender.country,
      'USD'
    )

    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey, provider)

    const busdContract = new ethers.Contract(busdAddress, BUSDABI, wallet)

    // get busd wallet balance
    // const walletBalance = await signedWallet.getBalance()
    const walletBalance = await busdContract.balanceOf(sender.address)

    const convertedBalance = await ethers.utils.formatEther(walletBalance)

    if (Number(convertedBalance) == 0.0) {
      return res.status(403).json({
        success: false,
        response: 'You do not have enough BUSD to complete this transaction',
      })
    }

    const tx_ = await busdContract.transfer(recieverAddress, amount_)

    txRecipt = await tx_.wait(1)

    if (txRecipt.status === 1 || txRecipt.status === '1') {
      // Create TX Objects here...
      const senderTx = await new Transaction({
        sender: sender._id,
        receiver: reciever._id,
        currency: sender.country,
        asset: 'BUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'sent',
        phoneNumber: reciever.phoneNumber,
      })

      const recieverTx = await new Transaction({
        sender: sender._id,
        receiver: reciever._id,
        currency: sender.country,
        asset: 'BUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'recieved',
        phoneNumber: sender.phoneNumber,
      })

      const tx = await senderTx.save()

      const toTx = await recieverTx.save()

      // Check to see if the user has a UserTransactions table
      const userTx = await UserTransactions.findOne({ user: sender._id })

      const receiverTx = await UserTransactions.findOne({
        user: reciever._id,
      })

      await userTx.transactions.push(tx._id)

      await receiverTx.transactions.push(toTx._id)

      await receiverTx.save()
      await userTx.save()

      return res.status(200).json({
        success: true,
        data: txRecipt,
      })
    } else {
      return res.status(403).json({
        success: false,
        response: 'Transaction failed',
      })
    }
  } catch (error) {
    // console.log(error.message)
    res.status(500).json({ success: false, response: error.message })
  }
}

const nfcPayAPI = async (req, res) => {
  try {
    const { tagNo, invoice } = req.body

    const currencyUser = req.user

    const nfcCard = await NfcCard.findOne({ tagNo: tagNo })

    if (!nfcCard) {
      return res
        .status(404)
        .json({ success: false, response: 'Card not found' })
    }

    if (currencyUser.userId === nfcCard.user) {
      return res.status(400).json({
        success: false,
        response: 'Self payments are not permitted',
      })
    }

    const sender = await User.findById(nfcCard.user)

    if (!sender) {
      return res
        .status(404)
        .json({ success: false, response: 'User does not exist' })
    }

    if (!invoice) {
      return res
        .status(403)
        .json({ success: false, response: 'Please enter a valid invoice' })
    }

    const { adminKey: payerKey } = await LightningWallet.findOne({
      user: sender._id,
    })

    // decrypt the inKey
    const keyPayer = await decrypt(payerKey)

    const currentUserBalance = await getLightningWalletBalance(keyPayer)

    const lightningTxCosts = platformPayoutFeeAmount(amount)

    const totalSpend = Number(amount) + Number(lightningTxCosts)

    if (Number(currentUserBalance) <= Number(totalSpend)) {
      return res
        .status(403)
        .json({ response: 'You do not have enough sats to pay out.' })
    }

    if (invoice) {
      // console.log('Invoice valid!')

      const payData = {
        out: true,
        bolt11: invoice,
      }

      //   Sender payment goes
      const result = await payLightingInvoice(keyPayer, payData)

      if (result.status === 403) {
        return res
          .status(403)
          .json({ success: false, response: 'Forbidden transaction' })
      }

      if (result?.payment_hash) {
        const activeInvoice = await ActiveInvoice.findOne({
          hash: result.payment_hash,
        })

        const reciever = await User.findById(activeInvoice.user)
        const platformFeeTxData = {
          out: true,
          bolt11: platformTxInvoice.payment_request,
        }

        // Sender pay platform fees here
        await payLightingInvoice(keyPayer, platformFeeTxData)

        // Create TX Objects here...
        const senderTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: activeInvoice.amount,
          txType: 'sent',
          phoneNumber: reciever.phoneNumber,
        })

        const recieverTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: activeInvoice.amount,
          txType: 'recieved',
          phoneNumber: sender.phoneNumber,
        })

        const tx = await senderTx.save()

        const toTx = await recieverTx.save()

        // Check to see if the user has a UserTransactions table
        const userTx = await UserTransactions.findOne({ user: sender._id })

        const receiverTx = await UserTransactions.findOne({
          user: reciever._id,
        })

        await userTx.transactions.push(tx._id)

        await receiverTx.transactions.push(toTx._id)

        await receiverTx.save()
        await userTx.save()

        return res.status(200).json({
          success: true,
          data: sender,
        })
      }
    } else {
      return res.status(200).json({
        success: true,
        data: `You do not have enough sats to pay out.`,
      })
    }
  } catch (error) {
    // console.log(error.message)
    res.status(500).json({ success: false, response: error.message })
  }
}

const payBTCInvoiceAPI = async (req, res) => {
  try {
    const { from, invoice, amount } = req.body

    const sender = await User.findById(from)

    if (!invoice) {
      return res.status(403).json({ response: 'Please enter a valid invoice' })
    }

    const { adminKey: payerKey } = await LightningWallet.findOne({
      user: sender._id,
    })

    // decrypt the inKey
    const keyPayer = await decrypt(payerKey)

    const currentUserBalance = await getLightningWalletBalance(keyPayer)

    const lightningTxCosts = platformPayoutFeeAmount(amount)

    const totalSpend = Number(amount) + Number(lightningTxCosts)

    if (Number(currentUserBalance) <= Number(totalSpend)) {
      return res
        .status(403)
        .json({ response: 'You do not have enough sats to pay out.' })
    }

    if (invoice) {
      // console.log('Invoice valid!')

      const payData = {
        out: true,
        bolt11: invoice,
      }

      //   Sender payment goes
      const result = await payLightingInvoice(keyPayer, payData)

      if (result?.payment_hash) {
        const activeInvoice = await ActiveInvoice.findOne({
          hash: result.payment_hash,
        })

        const platformTxInvoice = await createBTCPlatformTxFeeInvoice(
          sender,
          amount
        )

        const reciever = await User.findById(activeInvoice.user)

        const platformFeeTxData = {
          out: true,
          bolt11: platformTxInvoice.payment_request,
        }

        // Sender pay platform fees here
        await payLightingInvoice(keyPayer, platformFeeTxData)

        // Create TX Objects here...
        const senderTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: activeInvoice.amount,
          txType: 'sent',
          phoneNumber: reciever.phoneNumber,
        })

        const recieverTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: activeInvoice.amount,
          txType: 'recieved',
          phoneNumber: sender.phoneNumber,
        })

        const tx = await senderTx.save()

        const toTx = await recieverTx.save()

        // Check to see if the user has a UserTransactions table
        const userTx = await UserTransactions.findOne({ user: sender._id })

        const receiverTx = await UserTransactions.findOne({
          user: reciever._id,
        })

        await userTx.transactions.push(tx._id)

        await receiverTx.transactions.push(toTx._id)

        await receiverTx.save()
        await userTx.save()

        return res.status(200).json({
          success: true,
          // data: tx,
        })
      }
    } else {
      return res.status(200).json({
        success: true,
        data: `You do not have enough sats to pay out.`,
      })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

async function sendApiBUSD(req, res) {
  try {
    const { from, to, amount, memo } = req.body

    const currentUser = await User.findById(from)

    const reciever = await User.findById(to)

    if (!reciever) {
      return res
        .status(404)
        .json({ response: 'The User does not have a Shukuru Wallet' })
    }

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // Get the reciever's address from db
    const recieverAddress = reciever.address

    const convertedToUSDAmount = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey, provider)

    const busdContract = new ethers.Contract(busdAddress, BUSDABI, wallet)

    // get busd wallet balance
    // const walletBalance = await signedWallet.getBalance()
    const walletBalance = await busdContract.balanceOf(currentUser.address)

    const convertedBalance = await ethers.utils.formatEther(walletBalance)

    if (Number(convertedBalance) == 0.0) {
      return res.status(403).json({
        success: false,
        response: 'You do not have enough BUSD to complete this transaction',
      })
    }

    const tx_ = await busdContract.transfer(recieverAddress, amount_)

    txRecipt = await tx_.wait(1)

    if (txRecipt.status === 1 || txRecipt.status === '1') {
      // Create TX Objects here...
      const senderTx = await new Transaction({
        sender: currentUser._id,
        receiver: reciever._id,
        currency: currentUser.country,
        asset: 'BUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'sent',
        phoneNumber: reciever.phoneNumber,
      })

      const recieverTx = await new Transaction({
        sender: currentUser._id,
        receiver: reciever._id,
        currency: currentUser.country,
        asset: 'BUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'recieved',
        phoneNumber: currentUser.phoneNumber,
      })

      const tx = await senderTx.save()

      const toTx = await recieverTx.save()

      // Check to see if the user has a UserTransactions table
      const userTx = await UserTransactions.findOne({ user: currentUser._id })

      const receiverTx = await UserTransactions.findOne({
        user: reciever._id,
      })

      await userTx.transactions.push(tx._id)

      await receiverTx.transactions.push(toTx._id)

      await receiverTx.save()
      await userTx.save()

      return res.status(200).json({
        success: true,
        data: txRecipt,
      })
    } else {
      return res.status(403).json({
        success: false,
        response: 'Transaction failed',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function sendApiCeloUSD(req, res) {
  try {
    const { from, to, amount, memo } = req.body

    const sender = await User.findById(from)

    const reciever = await User.findById(to)

    if (!reciever) {
      return res
        .status(404)
        .json({ response: 'The User does not have a Shukuru Wallet' })
    }

    let cUSDtoken = await kit.contracts.getStableToken()

    // This lines will convert the cUSD balance from the user's local currency back to USD
    const convertedToUSDAmount = await currencyConvertor(
      amount,
      sender.country,
      'USD'
    )
    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // Get the current user / payer passkey
    const dbPrivateKey = sender.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // tx object
    await kit.connection.addAccount(privateKey)

    // get wallet balance
    const walletBalance = await cUSDtoken.balanceOf(sender.address)

    const convertedBalance = await ethers.utils.formatEther(
      walletBalance.toString()
    )

    if (Number(convertedBalance) === 0.0 || Number(convertedBalance) === 0) {
      // response = `END Payment Failed\n`
      // response += `Make sure you have enough ETH in your wallet\n`
      // sendSMS(
      //   `You dont have enough balance to pay ${amount_} cUSD to ${paidUserPhone}`,
      //   currentUser.phoneNumber
      // )
      return res.status(403).json({ response: 'Insufficent cUSD balance' })
    }

    // SENDING
    const result = await cUSDtoken
      .transfer(reciever.address, amount_)
      .send({ from: sender.address })

    let txRecipt = await result.waitReceipt()

    // const convertedToReciever = await currencyConvertor(
    //   convertedToUSDAmount,
    //   'USD',
    //   currentUser.country
    // )

    if (!txRecipt.status) {
      return res.status(403).json({ response: 'Transaction failed!' })
    }

    // Create TX Objects here...
    const senderTx = await new Transaction({
      sender: sender._id,
      receiver: reciever._id,
      currency: sender.country,
      asset: 'cUSD',
      amount: amount,
      txHash: txRecipt.transactionHash,
      txType: 'sent',
      phoneNumber: reciever.phoneNumber,
    })

    const recieverTx = await new Transaction({
      sender: sender._id,
      receiver: reciever._id,
      currency: sender.country,
      asset: 'cUSD',
      amount: amount,
      txHash: txRecipt.transactionHash,
      txType: 'recieved',
      phoneNumber: sender.phoneNumber,
    })

    const tx = await senderTx.save()

    const toTx = await recieverTx.save()

    // Check to see if the user has a UserTransactions table
    const userTx = await UserTransactions.findOne({ user: sender._id })

    const receiverTx = await UserTransactions.findOne({
      user: reciever._id,
    })

    await userTx.transactions.push(tx._id)

    await receiverTx.transactions.push(toTx._id)

    await receiverTx.save()
    await userTx.save()

    return res.status(200).json({
      success: true,
      data: txRecipt,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const sendLightningApiPayment = async (req, res) => {
  try {
    const { from, to, amount, memo } = req.body

    const sender = await User.findById(from)

    const reciever = await User.findById(to)

    if (!reciever) {
      return res.status(404).json({
        success: false,
        response: 'The User does not have a Shukuru Wallet',
      })
    }

    const { adminKey: payerKey } = await LightningWallet.findOne({
      user: sender._id,
    })

    const { inKey: recieverKey } = await LightningWallet.findOne({
      user: reciever._id,
    })

    // decrypt the inKey
    const keyPayer = await decrypt(payerKey)

    // decrypt the inKey
    const keyReciever = await decrypt(recieverKey)

    const currentUserBalance = await getLightningWalletBalance(keyPayer)

    const lightningTxCosts = platformPayoutFeeAmount(amount)

    const totalSpend = Number(amount) + Number(lightningTxCosts)

    if (Number(currentUserBalance) <= Number(totalSpend)) {
      return res.status(403).json({
        success: false,
        response: 'You do not have enough sats to pay out.',
      })
    }

    // Create the invoice from the reciever
    const data = {
      out: false,
      amount: amount,
      memo: memo,
      unit: sender.country,
    }

    const invoiceResponse = await createLightingInvoice(keyReciever, data)

    if (invoiceResponse.status === 403) {
      return res
        .status(403)
        .json({ success: false, response: 'Forbidden transaction' })
    }

    if (invoiceResponse.payment_hash) {
      console.log('Invoice created!')

      const platformTxInvoice = await createBTCPlatformTxFeeInvoice(
        sender,
        amount
      )

      const payData = {
        out: true,
        bolt11: invoiceResponse.payment_request,
      }

      //   Sender payment goes
      const result = await payLightingInvoice(keyPayer, payData)

      if (result?.payment_hash) {
        const platformFeeTxData = {
          out: true,
          bolt11: platformTxInvoice.payment_request,
        }

        // Sender pay platform fees here
        await payLightingInvoice(keyPayer, platformFeeTxData)

        // Create TX Objects here...
        const senderTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: amount,
          txType: 'sent',
          phoneNumber: reciever.phoneNumber,
        })

        const recieverTx = await new Transaction({
          sender: sender._id,
          receiver: reciever._id,
          currency: sender.country,
          asset: 'Lightning',
          amount: amount,
          txType: 'recieved',
          phoneNumber: sender.phoneNumber,
        })

        const tx = await senderTx.save()

        const toTx = await recieverTx.save()

        // Check to see if the user has a UserTransactions table
        const userTx = await UserTransactions.findOne({ user: sender._id })

        const receiverTx = await UserTransactions.findOne({
          user: reciever._id,
        })

        await userTx.transactions.push(tx._id)

        await receiverTx.transactions.push(toTx._id)

        await receiverTx.save()
        await userTx.save()

        return res.status(200).json({
          success: true,
          data: sender,
        })
      }
    } else {
      //   await sendSMS(
      //     `You do not have enough sats to pay out.`,
      //     currentUser.phoneNumber
      //   )
      return res.status(200).json({
        success: false,
        data: `You do not have enough sats to pay out.`,
      })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

async function sendApiCeloUSD(req, res) {
  try {
    const { from, to, amount, memo } = req.body

    const sender = await User.findById(from)

    const reciever = await User.findById(to)

    if (!reciever) {
      return res
        .status(404)
        .json({ response: 'The User does not have a Shukuru Wallet' })
    }

    let cUSDtoken = await kit.contracts.getStableToken()

    // This lines will convert the cUSD balance from the user's local currency back to USD
    const convertedToUSDAmount = await currencyConvertor(
      amount,
      sender.country,
      'USD'
    )
    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // Get the current user / payer passkey
    const dbPrivateKey = sender.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // tx object
    await kit.connection.addAccount(privateKey)

    // get wallet balance
    const walletBalance = await cUSDtoken.balanceOf(sender.address)

    const convertedBalance = await ethers.utils.formatEther(
      walletBalance.toString()
    )

    if (Number(convertedBalance) === 0.0 || Number(convertedBalance) === 0) {
      // response = `END Payment Failed\n`
      // response += `Make sure you have enough ETH in your wallet\n`
      // sendSMS(
      //   `You dont have enough balance to pay ${amount_} cUSD to ${paidUserPhone}`,
      //   currentUser.phoneNumber
      // )
      return res.status(403).json({ response: 'Insufficent cUSD balance' })
    }

    // SENDING
    const result = await cUSDtoken
      .transfer(reciever.address, amount_)
      .send({ from: sender.address })

    let txRecipt = await result.waitReceipt()

    // const convertedToReciever = await currencyConvertor(
    //   convertedToUSDAmount,
    //   'USD',
    //   currentUser.country
    // )

    if (!txRecipt.status) {
      return res.status(403).json({ response: 'Transaction failed!' })
    }

    // Create TX Objects here...
    const senderTx = await new Transaction({
      sender: sender._id,
      receiver: reciever._id,
      currency: sender.country,
      asset: 'cUSD',
      amount: amount,
      txHash: txRecipt.transactionHash,
      txType: 'sent',
      phoneNumber: reciever.phoneNumber,
    })

    const recieverTx = await new Transaction({
      sender: sender._id,
      receiver: reciever._id,
      currency: sender.country,
      asset: 'cUSD',
      amount: amount,
      txHash: txRecipt.transactionHash,
      txType: 'recieved',
      phoneNumber: sender.phoneNumber,
    })

    const tx = await senderTx.save()

    const toTx = await recieverTx.save()

    // Check to see if the user has a UserTransactions table
    const userTx = await UserTransactions.findOne({ user: sender._id })

    const receiverTx = await UserTransactions.findOne({
      user: reciever._id,
    })

    await userTx.transactions.push(tx._id)

    await receiverTx.transactions.push(toTx._id)

    await receiverTx.save()
    await userTx.save()

    return res.status(200).json({
      success: true,
      data: txRecipt,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

module.exports = {
  sendLightningApiPayment,
  sendApiCeloUSD,
  createAPILightningInvoice,
  decodeInvoiceAPI,
  payBTCInvoiceAPI,
  getBTCWalletTransactionsAPI,
  getInvoiceStatusAPI,
  sendApiBUSD,
  nfcPayAPI,
  nfcPayBUSDAPI,
}
