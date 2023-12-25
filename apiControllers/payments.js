const ContractKit = require('@celo/contractkit')
const {
  celoProviderUrl,
  bscProviderURL,
  busdAddress,
  cusdAddress,
  adminAddress,
} = require('../settings/settings.js')

const Web3 = require('web3')
const ethers = require('ethers')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const {
  createLightingInvoice,
} = require('../lightning/createLightningInvoice.js')
const { decrypt } = require('../security/encrypt.js')
const LightningWallet = require('../models/LightningWallet.js')
const { payLightingInvoice } = require('../lightning/payLightingInvoice.js')
const {
  createBTCPlatformTxFeeInvoice,
  sendAdminPayment,
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
const { telegramOrder } = require('./alerts.js')
const { sendcUSDKit } = require('../helpers/signer.js')
const {
  boltPOSTRequest,
  boltGETRequest,
  boltPayInvoice,
} = require('../helpers/boltRequests.js')
const { boltSendSatsHelper } = require('../helpers/boltHelpers.js')

require('dotenv').config()

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

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

    const data = {
      payment_hash: invoice,
    }

    const boltInstance = await boltGETRequest(data, req.bolt, '/invoice')

    if (!boltInstance.success)
      return res
        .status(403)
        .json({ succes: false, error: 'Failed to read invoice' })

    return res.status(201).json({
      success: true,
      data: {
        hash: boltInstance.response.payment_hash,
        amount: Number(boltInstance.response.num_satoshis),
        memo: boltInstance.response.description,
        date: boltInstance.response.timestamp,
        expiry: boltInstance.response.expiry,
      },
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const createAPILightningInvoice = async (req, res) => {
  try {
    const { userId, amount, memo } = req.body

    const user = req.user

    const data = {
      amount: Number(amount),
      memo: memo,
    }

    const boltInstance = await boltPOSTRequest(data, req.bolt, '/invoice')

    if (!boltInstance.success)
      return res
        .status(403)
        .json({ succes: false, error: 'Failed to create invoice' })

    const activeInv = new ActiveInvoice({
      user: user.userId,
      hash: boltInstance.response.payment_request,
    })

    await activeInv.save()

    return res.status(201).json({
      success: true,
      data: boltInstance.response.payment_request,
      request: boltInstance.response.payment_request,
      r_hash: boltInstance.response.r_hash,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const lookupAPIInvoiceStatus = async (req, res) => {
  try {
    const { r_hash } = req.body

    // Re-decode the invoice hash
    const binaryRHash = Buffer.from(r_hash, 'base64')

    // // Convert binary data to hexadecimal string
    const hexRHash = binaryRHash.toString('hex')

    const data = {
      r_hash: hexRHash,
    }

    const boltInstance = await boltGETRequest(data, req.bolt, '/invoice/lookup')

    if (!boltInstance.success)
      return res
        .status(403)
        .json({ succes: false, error: 'Failed to get invoice info' })

    return res.status(201).json({
      success: true,
      data: boltInstance,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const updateLegacyData = async (req, res) => {
  try {
    const boltInstance = await boltGETRequest(
      null,
      req.bolt,
      '/invoice/legacies'
    )

    return res.json(boltInstance)
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

const createExternalBTCTXAPI = async (req, res) => {
  try {
    const { invoice, amount } = req.body

    const { userId } = req.user

    const currencyUser = await User.findById(userId)

    if (!currencyUser) {
      return res.status(403).json({
        success: false,
        response: 'Not Authorized',
      })
    }

    if (!invoice) {
      return res
        .status(403)
        .json({ success: false, response: 'Please enter a valid invoice' })
    }

    const receiverTx = await new Transaction({
      receiver: currencyUser._id,
      external: true,
      currency: currencyUser.country,
      asset: 'Lightning',
      amount: amount,
      txType: 'recieved',
      phoneNumber: currencyUser.phoneNumber,
    })

    const tx = await receiverTx.save()

    // Check to see if the user has a UserTransactions table
    const userTx = await UserTransactions.findOne({ user: currencyUser._id })

    await userTx.transactions.push(tx._id)

    await userTx.save()

    return res.status(200).json({
      success: true,
      data: currencyUser,
      tx: tx,
    })
  } catch (error) {
    // console.log(error.message)
    res.status(500).json({ success: false, response: error.message })
  }
}

const nfcPayAPI = async (req, res) => {
  try {
    const { tagNo, invoice, amount } = req.body

    const currencyUser = req.user

    const nfcCard = await NfcCard.findOne({ tagNo: tagNo })

    if (!nfcCard) {
      return res
        .status(404)
        .json({ success: false, response: 'Card not found' })
    }

    if (currencyUser.userId === nfcCard.user.toString()) {
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

      // const currentUserBalance = await getLightningWalletBalance(keyPayer)

      // const lightningTxCosts = platformPayoutFeeAmount(amount)

      // const totalSpend = Number(amount) + Number(lightningTxCosts)

      // if (Number(currentUserBalance) <= Number(totalSpend)) {
      //   return res.status(403).json({
      //     success: false,
      //     response: 'You do not have enough sats to pay out.',
      //   })
      // }

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
          data: sender,
          tx: tx,
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
    const { from, invoice, amount, r_hash } = req.body

    const { userId } = req.user

    if (!invoice) {
      return res.status(403).json({ response: 'Please enter a valid invoice' })
    }

    // Re-docde the r_hash so that it can be read by bolt

    const requestData = {
      from,
      to: null,
      invoice,
      amount,
      userId,
      bolt: req.bolt,
      r_hash,
    }

    // Here is the send sats helper...
    const result = await boltSendSatsHelper(requestData)

    return res.json(result)
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

async function getCeloGasEstimateAPI(req, res) {
  try {
    const { from, to, amount, memo } = req.body

    const currentUser = await User.findById(from)

    const reciever = await User.findById(to)

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
    const wallet = await new ethers.Wallet(privateKey, celoProvider)

    const cusdContract = new ethers.Contract(cusdAddress, BUSDABI, wallet)

    // get busd wallet balance
    // const walletBalance = await signedWallet.getBalance()
    // const walletBalance = await busdContract.balanceOf(currentUser.address)

    // const convertedBalance = await ethers.utils.formatEther(walletBalance)

    // if (Number(convertedBalance) == 0.0) {
    //   return res.status(403).json({
    //     success: false,
    //     response: 'You do not have enough BUSD to complete this transaction',
    //   })
    // }

    const gasEstimate = await cusdContract.estimateGas.transfer(
      recieverAddress,
      amount_
    )

    if (gasEstimate) {
      const formattedGas = ethers.utils.formatUnits(gasEstimate, 'gwei')

      // Convert the gas fee here?...

      const gasInLocal = await currencyConvertor(
        formattedGas,
        'USD',
        currentUser.country
      )

      return res.status(200).json({
        success: true,
        data: gasInLocal,
      })
    } else {
      return res.status(404).json({
        success: false,
        response: 'Failed to get gas estimate',
      })
    }
  } catch (error) {
    // console.log(error.message) .
    return res.status(500).json(error.message)
  }
}

async function getBUSDGasEstimateAPI(req, res) {
  try {
    const { from, to, amount, memo } = req.body

    const currentUser = await User.findById(from)

    const reciever = await User.findById(to)

    // if (!reciever) {
    //   return res
    //     .status(404)
    //     .json({ response: 'The User does not have a Shukuru Wallet' })
    // }

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
    // const walletBalance = await busdContract.balanceOf(currentUser.address)

    // const convertedBalance = await ethers.utils.formatEther(walletBalance)

    // if (Number(convertedBalance) == 0.0) {
    //   return res.status(403).json({
    //     success: false,
    //     response: 'You do not have enough BUSD to complete this transaction',
    //   })
    // }

    const gasEstimate = await busdContract.estimateGas.transfer(
      recieverAddress,
      amount_
    )

    if (gasEstimate) {
      const formattedGas = ethers.utils.formatUnits(gasEstimate, 'gwei')

      // Convert the gas fee here?...

      const gasInLocal = await currencyConvertor(
        formattedGas,
        'USD',
        currentUser.country
      )

      return res.status(200).json({
        success: true,
        data: gasInLocal,
      })
    } else {
      return res.status(404).json({
        success: false,
        response: 'Failed to get gas estimate',
      })
    }
  } catch (error) {
    // console.log(error.message) .
    return res.status(500).json(error.message)
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
        tx: tx,
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

async function checkCeloGas(req, res) {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)

    let walletBalance = await kit.celoTokens.balancesOf(user.address)

    const bnbBalance = await provider.getBalance(user.address)

    const formattedGas = walletBalance.CELO.toNumber() / 10 ** 18

    const balance = ethers.utils.formatEther(bnbBalance)

    walletBalance['celo'] = formattedGas
    walletBalance['bnb'] = balance.toString()

    return res.status(200).json({
      success: true,
      balances: walletBalance,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

const sendLightningApiPayment = async (req, res) => {
  try {
    const { from, to, amount } = req.body

    const { userId } = req.user

    const reciever = await User.findOne({ name: to })

    if (!reciever) {
      return res.status(404).json({
        success: false,
        response: 'The User does not have a Shukuru Wallet',
      })
    }

    const requestData = {
      from,
      to,
      invoice: null,
      amount: Number(amount),
      userId,
      bolt: req.bolt,
    }

    const result = await boltSendSatsHelper(requestData)

    return res.json(result)
  } catch (error) {
    console.log(error.message)
    res.status(500).json(error.message)
  }
}

// async function sendApiCeloUSD(req, res) {
//   try {
//     const { from, to, amount, memo } = req.body

//     const sender = await User.findById(from)

//     const reciever = await User.findById(to)

//     if (!reciever) {
//       return res
//         .status(404)
//         .json({ response: 'The User does not have a Shukuru Wallet' })
//     }

//     let cUSDtoken = await kit.contracts.getStableToken()

//     // This lines will convert the cUSD balance from the user's local currency back to USD
//     const convertedToUSDAmount = await currencyConvertor(
//       amount,
//       sender.country,
//       'USD'
//     )
//     const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

//     const amount_ = parsedAmount.toString()

//     // Get the current user / payer passkey
//     const dbPrivateKey = sender.passKey

//     // Decrypt the passKey
//     const privateKey = await decrypt(dbPrivateKey)

//     // tx object
//     await kit.connection.addAccount(privateKey)

//     // get wallet balance
//     const walletBalance = await cUSDtoken.balanceOf(sender.address)

//     const convertedBalance = await ethers.utils.formatEther(
//       walletBalance.toString()
//     )

//     if (Number(convertedBalance) === 0.0 || Number(convertedBalance) === 0) {
//       // response = `END Payment Failed\n`
//       // response += `Make sure you have enough ETH in your wallet\n`
//       // sendSMS(
//       //   `You dont have enough balance to pay ${amount_} cUSD to ${paidUserPhone}`,
//       //   currentUser.phoneNumber
//       // )
//       return res.status(403).json({ response: 'Insufficent cUSD balance' })
//     }

//     // SENDING
//     const result = await cUSDtoken
//       .transfer(reciever.address, amount_)
//       .send({ from: sender.address })

//     let txRecipt = await result.waitReceipt()

//     // const convertedToReciever = await currencyConvertor(
//     //   convertedToUSDAmount,
//     //   'USD',
//     //   currentUser.country
//     // )

//     if (!txRecipt.status) {
//       return res.status(403).json({ response: 'Transaction failed!' })
//     }

//     // Create TX Objects here...
//     const senderTx = await new Transaction({
//       sender: sender._id,
//       receiver: reciever._id,
//       currency: sender.country,
//       asset: 'cUSD',
//       amount: amount,
//       txHash: txRecipt.transactionHash,
//       txType: 'sent',
//       phoneNumber: reciever.phoneNumber,
//     })

//     const recieverTx = await new Transaction({
//       sender: sender._id,
//       receiver: reciever._id,
//       currency: sender.country,
//       asset: 'cUSD',
//       amount: amount,
//       txHash: txRecipt.transactionHash,
//       txType: 'recieved',
//       phoneNumber: sender.phoneNumber,
//     })

//     const tx = await senderTx.save()

//     const toTx = await recieverTx.save()

//     // Check to see if the user has a UserTransactions table
//     const userTx = await UserTransactions.findOne({ user: sender._id })

//     const receiverTx = await UserTransactions.findOne({
//       user: reciever._id,
//     })

//     await userTx.transactions.push(tx._id)

//     await receiverTx.transactions.push(toTx._id)

//     await receiverTx.save()
//     await userTx.save()

//     return res.status(200).json({
//       success: true,
//       data: txRecipt,
//     })
//   } catch (error) {
//     console.log(error.message)
//     return res.status(500).json(error.message)
//   }
// }

async function getRawBUSDGasEstimateAPI(req, res) {
  try {
    const { from, to, amount } = req.body

    const currentUser = await User.findOne({ address: from })

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // Get the reciever's address from db
    const recieverAddress = to

    const convertedToUSDAmount = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    const amountRoundedOff = Number(convertedToUSDAmount).toFixed(3)

    const parsedAmount = await ethers.utils.parseEther(amountRoundedOff)

    const amount_ = parsedAmount.toString()

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey, provider)

    const busdContract = new ethers.Contract(busdAddress, BUSDABI, wallet)

    // get busd wallet balance
    // const walletBalance = await signedWallet.getBalance()
    // const walletBalance = await busdContract.balanceOf(currentUser.address)

    // const convertedBalance = await ethers.utils.formatEther(walletBalance)

    // if (Number(convertedBalance) == 0.0) {
    //   return res.status(403).json({
    //     success: false,
    //     response: 'You do not have enough BUSD to complete this transaction',
    //   })
    // }

    const gasEstimate = await busdContract.estimateGas.transfer(
      recieverAddress,
      amount_
    )

    if (gasEstimate) {
      const formattedGas = ethers.utils.formatUnits(gasEstimate, 'gwei')

      // Convert the gas fee here?...

      const spendInLocal = await currencyConvertor(
        amount,
        'USD',
        currentUser.country
      )

      const gasInLocal = await currencyConvertor(
        formattedGas,
        'USD',
        currentUser.country
      )

      return res.status(200).json({
        success: true,
        data: gasInLocal,
        spend: spendInLocal,
      })
    } else {
      return res.status(404).json({
        success: false,
        response: 'Failed to get gas estimate',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function getRawCUSDGasEstimateAPI(req, res) {
  try {
    const { from, to, amount } = req.body

    const currentUser = await User.findOne({ address: from })

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // Get the reciever's address from db
    const recieverAddress = to

    const convertedToUSDAmount = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    const amountRoundedOff = Number(convertedToUSDAmount).toFixed(3)

    const parsedAmount = await ethers.utils.parseEther(amountRoundedOff)

    const amount_ = parsedAmount.toString()

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey, provider)

    // HERE >>>>>>
    const cusdContract = new ethers.Contract(cusdAddress, BUSDABI, wallet)

    const gasEstimate = await cusdContract.estimateGas.transfer(
      recieverAddress,
      amount_
    )

    if (gasEstimate) {
      const formattedGas = ethers.utils.formatUnits(gasEstimate, 'gwei')

      // Convert the gas fee here?...

      const spendInLocal = await currencyConvertor(
        amount,
        'USD',
        currentUser.country
      )

      const gasInLocal = await currencyConvertor(
        formattedGas,
        'USD',
        currentUser.country
      )

      return res.status(200).json({
        success: true,
        data: gasInLocal,
        spend: spendInLocal,
      })
    } else {
      return res.status(404).json({
        success: false,
        response: 'Failed to get gas estimate',
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function sendRawApiCeloUSD(req, res) {
  try {
    const { from, to, amount } = req.body

    let receiverAddress

    const sender = await User.findOne({ address: from })

    const reciever = await User.findOne({ address: to })

    if (!reciever) {
      receiverAddress = to
    } else {
      receiverAddress = reciever.address
    }

    let txRecipt = await sendcUSDKit(sender, reciever, amount)

    if (!txRecipt.status) {
      return res
        .status(403)
        .json({ success: false, response: 'Transaction failed!' })
    }

    if (reciever) {
      // Create TX Objects here...
      const senderTx = await new Transaction({
        sender: sender._id,
        receiver: reciever?._id,
        currency: sender.country,
        asset: 'cUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'sent',
        external: true,
        phoneNumber: reciever?.phoneNumber,
      })

      const recieverTx = await new Transaction({
        sender: sender?._id,
        receiver: reciever?._id,
        currency: sender.country,
        asset: 'cUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'recieved',
        external: true,
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
        tx: tx,
      })
    } else {
      // Check to see if the user has a UserTransactions table
      const userTx = await UserTransactions.findOne({ user: sender._id })

      // Create TX Objects here...
      const senderTx = await new Transaction({
        sender: sender._id,
        currency: sender.country,
        asset: 'cUSD',
        amount: amount,
        txHash: txRecipt.transactionHash,
        txType: 'sent',
        external: true,
      })

      const tx = await senderTx.save()

      await userTx.transactions.push(tx._id)

      await userTx.save()

      return res.status(200).json({
        success: true,
        data: txRecipt,
        tx: tx,
      })
    }
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function sendRawApiBUSD(req, res) {
  try {
    const { from, to, amount } = req.body

    let receiverAddress

    const currentUser = await User.findOne({ address: from })

    const reciever = await User.findOne({ address: to })

    if (!reciever) {
      receiverAddress = to
    } else {
      receiverAddress = reciever.address
    }

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    const convertedToUSDAmount = await currencyConvertor(
      amount,
      currentUser.country,
      'USD'
    )

    const roundedDecimalAmount = Number(convertedToUSDAmount).toFixed(3)

    const parsedAmount = await ethers.utils.parseEther(roundedDecimalAmount)

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

    const tx_ = await busdContract.transfer(receiverAddress, amount_)

    txRecipt = await tx_.wait(1)

    if (txRecipt.status === 1 || txRecipt.status === '1') {
      // Create TX Objects here...

      if (reciever) {
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
          tx: tx,
        })
      } else {
        // Check to see if the user has a UserTransactions table
        const userTx = await UserTransactions.findOne({ user: currentUser._id })

        // Create TX Objects here...
        const senderTx = await new Transaction({
          sender: currentUser._id,
          currency: currentUser.country,
          asset: 'BUSD',
          amount: amount,
          txHash: txRecipt.transactionHash,
          txType: 'sent',
          external: true,
        })

        const tx = await senderTx.save()

        await userTx.transactions.push(tx._id)

        await userTx.save()

        return res.status(200).json({
          success: true,
          data: txRecipt,
          tx: tx,
        })
      }
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

async function buyUtility(req, res) {
  try {
    const { network, package, asset, amount, phone } = req.body

    const user = req.user

    const sender = await User.findById(user.userId)

    let txRecipt

    if (asset === 'lightning') {
      // Send lightning payment here...

      const boltReqData = {
        amount,
      }

      const houseBoltInstance = await boltGETRequest(
        boltReqData,
        req.bolt,
        '/invoice/utility'
      )

      if (!houseBoltInstance.success) {
        return res.status(200).json({
          success: false,
        })
      }
      // CUSD
    } else {
      txRecipt = await sendcUSDKit(sender, adminAddress, amount, true)

      if (!txRecipt.status) {
        return res
          .status(403)
          .json({ success: false, response: 'Transaction failed!' })
      }
    }
    // Notification goes here...

    // Send telegram order msg here...
    const htmlText = `<b>😍 Incoming Order</b>, <strong>${network} Data</strong>
    👉 Send ${package} data to ${sender.name} 📞 +${phone}. Paid with ${asset} TX `

    await telegramOrder(htmlText)

    // Create TX Objects here...
    const senderTx = await new Transaction({
      sender: sender._id,
      currency: sender.country,
      asset: asset,
      amount: amount,
      txHash: txRecipt?.transactionHash,
      txType: 'utility',
    })

    const tx = await senderTx.save()

    // Check to see if the user has a UserTransactions table
    const userTx = await UserTransactions.findOne({ user: sender._id })

    await userTx.transactions.push(tx._id)

    await userTx.save()

    return res.status(200).json({
      success: true,
      data: txRecipt,
      tx: tx,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json(error.message)
  }
}

async function requestForGas(req, res) {
  try {
    const { asset, userId } = req.body

    const sender = await User.findById(userId)

    // Send telegram order msg here...
    const htmlText = `
    <b>${asset} Gas Request</b>, 
    <strong>${sender.name}</strong> is requesting for some ${asset} gas
    Address: ${sender.address} 
    Phone: +${sender.phoneNumber}
    `

    await telegramOrder(htmlText)

    return res.status(200).json({
      success: true,
    })
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

    // This is the sendcUSD KIT
    let txRecipt = await sendcUSDKit(sender, reciever, amount)

    if (!txRecipt.status) {
      return res.status(403).json({ success: false, response: txRecipt })
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
      tx: tx,
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
  createExternalBTCTXAPI,
  getBUSDGasEstimateAPI,
  getCeloGasEstimateAPI,
  getRawBUSDGasEstimateAPI,
  getRawCUSDGasEstimateAPI,
  sendRawApiCeloUSD,
  sendRawApiBUSD,
  buyUtility,
  checkCeloGas,
  requestForGas,
  lookupAPIInvoiceStatus,
  updateLegacyData,
}
