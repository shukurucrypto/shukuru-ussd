const axios = require('axios')
require('dotenv').config()

const ADMIN_ID = process.env.ADMIN_ID
const API_KEY = process.env.API_KEY
const NODE_ID = process.env.NODE_ID
const LND_API_URL = process.env.LND_API_URL

// =https://legend.lnbits.com/usermanager/api/v1
const getLightningWalletTransactions = async (userKey) => {
  try {
    // const response = await axios.get(
    //   `https://legend.lnbits.com/usermanager/api/v1/wallets/${userKey}`,
    //   {
    //     headers: {
    //       'X-Api-Key': API_KEY,
    //     },
    //   } .
    // )
    const response = await axios.get(
      `https://legend.lnbits.com/usermanager/api/v1/transactions/${userKey}`,

      {
        headers: {
          'X-Api-Key': API_KEY,
        },
      }
    )
    return response.data
  } catch (error) {
    // console.log(error.response)
    return error.message
  }
}

module.exports = {
  getLightningWalletTransactions,
}
