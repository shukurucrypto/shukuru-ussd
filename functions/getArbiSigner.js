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
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)
// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.ARBITRUM_MAINET
// )

const getArbiSigner = async (phoneNumber) => {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)
    // console.log(`privateKey: ${privateKey}`)

    const signer = new ethers.Wallet(privateKey, provider)

    return signer
  } catch (error) {
    console.log('DEBUG HERE: -------------------------', error.message)
    return error.message
  }
}

module.exports = {
  getArbiSigner,
}
