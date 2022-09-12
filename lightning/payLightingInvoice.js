const axios = require('axios')
require('dotenv').config()

const LN_BITS_URL = process.env.LN_BITS_URL

const payLightingInvoice = async (userKey, data) => {
  try {
    const response = await axios.post(`${LN_BITS_URL}/payments`, data, {
      headers: {
        'X-Api-Key': userKey,
        'Content-type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

module.exports = {
  payLightingInvoice,
}
