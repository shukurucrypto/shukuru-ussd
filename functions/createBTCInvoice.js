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
      const bipEncoded = await bip21.encode(response.payment_hash)
      const qrUri = await QRCode.toDataURL(bipEncoded)
      sendSMS(
        `Shuku ${currentUser.name}, Your top-up invoice is here: https://url-to-qr-code/${response.payment_hash}`,
        phoneNumber
      )

      const savedInvoice = new Invoices({
        user: currentUser._id,
        paymentHash: response.payment_hash,
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

// {
//   payment_hash: 'ae09cf5ec28fcd67adc1e6ce711bfd1fd75e9b58458c29414663ab55663fda86',
//   payment_request: 'lnbc2450u1p337fjmsp5fz6rlk9wmzk486p452gqegvjhez4kuunw2s5ckzt4q2pcwguldeqpp54cyu7hkz3lxk0twpum88zxlarlt4ax6cgkxzjs2xvw442e3lm2rqdz52d5826m4ypgx2ar9wgkzq4r0wqs82upqxqhrqvpjxs6jq6twypkhjgrvd9nksarwd9hxwgrhv9kxcet59chqxqyjw5qcqpjrzjqvfmvmq69ax369sjcluaw9a3qfetaldhkqp78jehgneteds87km2kz6u4uqqs4gqqyqqqqqqqqqqpjqq9q9qyysgqc6alp7m4xa82tl3mz25qqdp3c62cal57qem2g7x7ter22jcf53wxdfa7dpgcdzvlsk40s5w2g39dg24c7q9mj0jtvl65hdpscycxtxqpvtc759',
//   checking_id: 'ae09cf5ec28fcd67adc1e6ce711bfd1fd75e9b58458c29414663ab55663fda86',
//   lnurl_response: null
// }
