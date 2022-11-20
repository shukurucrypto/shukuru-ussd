const User = require('../models/User.js')
const sendSMS = require('../SMS/smsFunctions.js')
require('dotenv').config()

async function sendWalletInfo(phoneNumber) {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    if (currentUser) {
      await sendSMS(
        ` 
          Shuku ${currentUser.name},\r\n
          A/C: ${currentUser.address}\r\n
          Chain: Arbitrum One\n
        `,
        phoneNumber
      )

      response = `END We have sent you an SMS showing your wallet info \n`

      return response
    } else {
      response = `END You do not have a Shukuru wallet yet`
      return response
    }
  } catch (err) {
    response = `END An error occurred`
    return response
  }
}

module.exports = {
  sendWalletInfo,
}
