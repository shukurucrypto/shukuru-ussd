const { getLightningWalletBalance } = require('../lightning/walletBalance.js')
const LightningWallet = require('../models/LightningWallet.js')
const { decrypt } = require('../security/encrypt.js')
const User = require('../models/User.js')
const axios = require('axios')

const getLightningBalance = async (phoneNumber) => {
  try {
    const currentUser = await User.findOne({ phoneNumber })

    const { inKey } = await LightningWallet.findOne({
      user: currentUser._id,
    })

    // decrypt the adminKey
    const key = await decrypt(inKey)
    const walletInfo = await getLightningWalletBalance(key)
    const btcWalletBalance = await btcBalConverter(walletInfo)
    return btcWalletBalance
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

const btcBalConverter = async (btcBalance) => {
  const bitcoinBalance = btcBalance / 100000000
  try {
    const data = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    )
    // console.log(data)
    // .then((response) => response.json())
    // .then((data) => {
    //   // console.log("DEBUG HERE: ", data.bitcoin);
    const bitcoinPrice = data.data.bitcoin.usd
    //   // Use the bitcoinPrice variable to convert Bitcoin stats into USD
    const usdBalance = bitcoinBalance * bitcoinPrice
    //   // console.log(usdBalance)
    return usdBalance
    // })
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getLightningBalance,
}
