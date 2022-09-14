const bip21 = require('bip21')
const QRCode = require('qrcode')

const { decrypt } = require('../security/encrypt.js')
const User = require('../models/User.js')
const Invoices = require('../models/Invoices.js')
const { getTopupBTCAmount } = require('../regex/ussdRegex.js')
const sendSMS = require('../SMS/smsFunctions.js')
const LightningWallet = require('../models/LightningWallet.js')
const {
  createLightingInvoice,
} = require('../lightning/createLightningInvoice.js')
const { generateQR } = require('../lightning/generateQR.js')

const createBTCInvoice = async (phoneNumber, text) => {
  try {
    const amount = await getTopupBTCAmount(text)

    const currentUser = await User.findOne({ phoneNumber })

    const { inKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the inKey
    const key = await decrypt(inKey)

    const data = {
      out: false,
      amount: amount,
      memo: `Shuku ${currentUser.name}, Top up ${amount} in my lightning wallet..`,
      unit: 'BTC',
    }

    const response = await createLightingInvoice(key, data)

    if (response.payment_hash) {
      // Encode the payment hash
      // const bipEncoded = await bip21.encode(response.payment_request)
      // const qrUri = await QRCode.toDataURL(bipEncoded)
      // console.log(qrUri)
      // const qrCode = await generateQR(response.payment_request)
      // console.log(response.payment_hash)
      sendSMS(
        `Shuku ${currentUser.name}, Your invoice is here: https://shukuru.vercel.app/qr=${response.payment_hash}`,
        phoneNumber
      )

      // console.log(`https://shukuru.vercel.app/ussd/qr=${response.payment_hash}`)

      const savedInvoice = new Invoices({
        user: currentUser._id,
        paymentHash: response.payment_hash,
        paymentRequest: response.payment_request,
      })

      await savedInvoice.save()
    }
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  createBTCInvoice,
}

// https://shukuru.vercel.app/qr=13a2c6eb3157bdac43c6894d0b0924fd264a40770bcf8da82b7067069f927c34
