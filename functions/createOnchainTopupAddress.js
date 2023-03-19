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
const { createLNURL } = require('../utils/createLNURL.js')
const { createBTCToLN } = require('../utils/createBTCToLN.js')

const createOnchainTopupAddress = async (phoneNumber, text) => {
  try {
    // Get the entry type

    const amount = await getTopupBTCAmount(text)

    const currentUser = await User.findOne({ phoneNumber })

    const { inKey, adminKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the inKey
    const key = await decrypt(inKey)
    const Adminkey = await decrypt(adminKey)

    const data = {
      amount: amount,
      description: `Shuku ${currentUser.name}, Top up ${amount} ${currentUser.country} in my lightning wallet..`,
      currency: currentUser.country,
    }

    const response = await createLNURL(Adminkey, data)

    if (response.lnurl) {
      //   Now we can create an onchain wallet address to send the btc to....
      const { address } = await createBTCToLN({
        lnurl_or_lnaddress: response.lnurl,
      })

      const invoiceUrl = await linkShortener(
        `https://shukuru.vercel.app/qr/${address}`
      )
      sendSMS(
        `Shuku ${currentUser.name}, Top-up BTC on your on-chain address here: ${address}. Or can the QR to get the address ${invoiceUrl}`,
        phoneNumber
      )

      // console.log(`https://shukuru.vercel.app/ussd/qr=${response.payment_hash}`)

      const savedInvoice = new Invoices({
        user: currentUser._id,
        paymentHash: response.lnurl,
        paymentRequest: response.lnurl,
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
    console.log(url)
    return url
  })
}

const linkShortener = (url) => {
  const result = Shortener.Shorten(url).then((res) => {
    if (typeof res === 'undefined') {
      console.log('Titlenot available')
      return '0xErr'
    } else {
      return res
    }
  })
  return result
}
module.exports = {
  createOnchainTopupAddress,
}

// https://shukuru.vercel.app/qr=13a2c6eb3157bdac43c6894d0b0924fd264a40770bcf8da82b7067069f927c34
// https://shukuru.vercel.app/qr=c32a7ca1ecc7ab739555c77da0b231790f6a875933a6130b35821eb701817b0e
// Shuku Jovan, Your invoice is here: https://shukuru.vercel.app/qr/57ce41b19a400fb81f0ec8a616f2ebe662796dbf34fa98dafa2645fe9e3e7f2f
