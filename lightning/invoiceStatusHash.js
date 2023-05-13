const axios = require('axios')
require('dotenv').config()

const LN_BITS_URL = process.env.LN_BITS_URL

const invoiceStatus = async (userKey, hash) => {
  try {
    const response = await axios.get(`${LN_BITS_URL}/payments/${hash}`, {
      headers: {
        'X-Api-Key': userKey,
      },
    })
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

module.exports = {
  invoiceStatus,
}
