const axios = require('axios')
require('dotenv').config()

const ADMIN_ID = process.env.ADMIN_ID
const API_KEY = process.env.API_KEY
const NODE_ID = process.env.NODE_ID
const LND_API_URL = process.env.LND_API_URL

const createLightningWallet = async (username) => {
  const data = {
    admin_id: ADMIN_ID,
    wallet_name: username,
    user_name: username,
  }
  try {
    const response = await axios.post(`${LND_API_URL}/users`, data, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    console.log(error.response)
  }
}

module.exports = {
  createLightningWallet,
}
