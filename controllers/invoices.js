const { btcBalConverter } = require('../functions/getLightningBalance')
const { getLightningWalletBalance } = require('../lightning/walletBalance')
const Invoices = require('../models/Invoices')
const LightningWallet = require('../models/LightningWallet')
const { decrypt } = require('../security/encrypt')

const getUserLightningBalance = async (req, res) => {
  try {
    // Get the user off the Invoices collection
    const { userId } = req.body

    // User that to the userKey from the lightning collection...

    const { inKey } = await LightningWallet.findOne({
      user: userId,
    })

    // decrypt the adminKey
    const key = await decrypt(inKey)
    const walletInfo = await getLightningWalletBalance(key)
    const btcWalletBalance = await btcBalConverter(walletInfo)

    res.send({
      response: btcWalletBalance,
    })
    // getLightningWalletBalance()
  } catch (err) {
    res.send(err.message)
    return err.message
  }
}

const getInvoice = async (req, res) => {
  try {
    const { hash } = req.body

    const invoice = await Invoices.findOne({ paymentHash: hash })

    if (!invoice) {
      return res.send({
        status: 404,
        response: 'We could not that invoice',
      })
    }

    return res.send({
      status: 200,
      response: invoice,
    })
  } catch (error) {
    res.send(error.message)
    return error.message
  }
}

module.exports = {
  getInvoice,
  getUserLightningBalance,
}
