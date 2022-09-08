const { getLightningWalletBalance } = require('../lightning/walletBalance.js')
const LightningWallet = require('../models/LightningWallet.js')
const { decrypt } = require('../security/encrypt.js')
const User = require('../models/User.js')

const getLightningBalance = async (phoneNumber) => {
  try {
    const currentUser = await User.findOne({ phoneNumber })

    const { inKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the adminKey
    const key = await decrypt(inKey)
    const walletInfo = await getLightningWalletBalance(key)
    return walletInfo
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  getLightningBalance,
}
