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
require('dotenv').config()

const sendLightningBtc = async (userText, phoneNumber) => {
  let response

  try {
    console.log('-----------SENDING LIGHTNING BTC-------------')

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

    const { adminKey: payerKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    const { inKey: recieverKey } = await LightningWallet.findOne({
      user: reciever._id,
    })

    // decrypt the inKey
    const keyPayer = await decrypt(payerKey)

    // decrypt the inKey
    const keyReciever = await decrypt(recieverKey)

    // Create the invoice from the reciever
    const data = {
      out: false,
      amount: amount,
      memo: `${currentUser.name} payment of ${amount} ${currentUser.country} to ${reciever.name}.`,
      unit: currentUser.country,
    }

    const invoiceResponse = await createLightingInvoice(keyReciever, data)

    if (invoiceResponse.payment_hash) {
      console.log('Invoice created!')

      const payData = {
        out: true,
        bolt11: invoiceResponse.payment_request,
      }

      const res = await payLightingInvoice(keyPayer, payData)

      if (res?.payment_hash) {
        await sendSMS(
          `Paid! You have successfully sent ${amount} BTC to ${reciever.phoneNumber}.`,
          currentUser.phoneNumber
        )

        await sendSMS(
          `Recieved! You have recived ${amount} BTC from ${currentUser.phoneNumber}.`,
          reciever.phoneNumber
        )
      }
    } else {
      await sendSMS(
        `You do not have enough sats to pay out.`,
        currentUser.phoneNumber
      )
    }

    // Make BTC transaction here
    // first of all create an invoice from the reciever account
    /*
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
    */
  } catch (error) {
    // console.log(error.message)
    return error.message
  }
}

// 0.00061000
// 0.00024000

module.exports = {
  sendLightningBtc,
}
