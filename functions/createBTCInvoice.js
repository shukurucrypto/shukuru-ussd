const bip21 = require('bip21')
const QRCode = require('qrcode')

const shortUrl = require('node-url-shortener')
const Shortener = require('link-shortener')
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
      memo: `Shuku ${currentUser.name}, Top up ${amount} ${currentUser.country} in my lightning wallet..`,
      unit: currentUser.country,
    }

    const response = await createLightingInvoice(key, data)

    if (response.payment_hash) {
      // Encode the payment hash
      // const bipEncoded = await bip21.encode(response.payment_request)
      // const qrUri = await QRCode.toDataURL(bipEncoded)
      // console.log(qrUri)
      // const qrCode = await generateQR(response.payment_request)
      // console.log(response.payment_hash)
      // const invoiceUrl = shortenUrl(`https://shukuru.vercel.app/qr/${response.payment_hash}`)
      const invoiceUrl = await linkShortener(`https://shukuru.vercel.app/qr/${response.payment_hash}`)
      sendSMS(
        `Shuku ${currentUser.name}, Your invoice is here: ${invoiceUrl}`,
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

const shortenUrl = (urlToShorten) => {
  shortUrl.short(urlToShorten, (err, url) => {
    console.log(url);
    return url
  })
}

const linkShortener = (url) => {
  const result = Shortener.Shorten(url, ).then((res) => {
    if(typeof res === "undefined"){
      console.log("Titlenot available");
      return "0xErr"
    }else {
      return res
    }
  })
  return result
}
module.exports = { 
  createBTCInvoice,
}

// https://shukuru.vercel.app/qr=13a2c6eb3157bdac43c6894d0b0924fd264a40770bcf8da82b7067069f927c34
// https://shukuru.vercel.app/qr=c32a7ca1ecc7ab739555c77da0b231790f6a875933a6130b35821eb701817b0e
// Shuku Jovan, Your invoice is here: https://shukuru.vercel.app/qr/57ce41b19a400fb81f0ec8a616f2ebe662796dbf34fa98dafa2645fe9e3e7f2f
