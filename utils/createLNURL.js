const axios = require('axios')
require('dotenv').config()

const LN_BITS_URL = process.env.LN_BITS_URL
const url = 'https://legend.lnbits.com/lnurlp/api/v1/links'

const createLNURL = async (adminKey, data) => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'X-Api-Key': adminKey,
      },
    })
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

module.exports = {
  createLNURL,
}
