const ethers = require('ethers')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const AccountSecrets = require('../models/AccountSecrets.js')
const { sendBitcoinTx } = require('../functions/sendBitcoinTx.js')
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const sendBtc = async (userText, phoneNumber) => {
  let response

  try {
    console.log('-----------SENDING BTC-------------')

    const currentUser = await User.findOne({ phoneNumber })

    // get the amount to be paid
    const amount = await getUserPaymentAmount(userText)

    // console.log('Amount is: ', amount)
    const userPhone = await getUserToPayPhoneNumber(userText)

    const paidUserPhone = userPhone.replace(/^0+/, '')

    // console.log("AMOUNT: ", paidUserPhone);
    const convertedPhoneToNumber = Number(paidUserPhone)

    // First get reciever's data thats in the db
    // const reciever = await User.findOne({ phoneNumber: paidUserPhone })
    const reciever = await User.findOne({
      phoneNumber: { $regex: convertedPhoneToNumber, $options: 'i' },
    })

    if (!reciever) {
      response = `END Payment Failed\n`
      response += `The user does not have a Shukuru Wallet\n`
      return response
    }

    // Get the current user secrets
    const btcSecretKey = await AccountSecrets.findOne({
      user: currentUser._id,
    })

    // Decrypt the passKey
    const privateKey = await decrypt(btcSecretKey.btc)

    // Get the reciever's btc address from db
    const recieverAddress = reciever.btcAddress.toString()

    // Make BTC transaction here
    const txRecipt = await sendBitcoinTx(
      currentUser.btcAddress.toString(),
      privateKey.toString(),
      recieverAddress,
      amount
    )

    if (txRecipt.txid) {
      await sendSMS(
        `You have successfully sent ${amount} BTC to ${reciever.phoneNumber}. Tx: ${txRecipt.txid}`,
        currentUser.phoneNumber
      )

      await sendSMS(
        `You have recived ${amount} BTC from ${currentUser.phoneNumber}. Tx: ${txRecipt.txid}`,
        reciever.phoneNumber
      )
    } else {
      await sendSMS(
        `You dont have enough BTC balance to pay ${paidUserPhone}`,
        currentUser.phoneNumber
      )
    }
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

// 0.00061000
// 0.00024000

module.exports = {
  sendBtc,
}
