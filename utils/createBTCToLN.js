const axios = require('axios')
require('dotenv').config()

const DREEZY_TOKEN = process.env.DREEZY_TOKEN

const createBTCToLN = async (data) => {
  try {
    const response = await axios.post(`https://api.deezy.io/v1/source`, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': DREEZY_TOKEN,
      },
    })

    return response.data
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  createBTCToLN,
}
