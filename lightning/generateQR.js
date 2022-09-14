const axios = require('axios')
require('dotenv').config()

const generateQR = async (paymentHash) => {
  try {
    /*
    const options = {
      method: 'GET',
      url: 'https://codzz-qr-cods.p.rapidapi.com/getQrcode',
      params: {
        type: 'text',
        value: paymentHash,
      },
      headers: {
        'X-RapidAPI-Key': '5fcfc1e3b7msh027d64cd7a3c018p122d12jsn207ab85fafe7',
        'X-RapidAPI-Host': 'codzz-qr-cods.p.rapidapi.com',
      },
    }
    const response = await axios.request(options)
    */
    const options = {
      method: 'GET',
      url: 'https://codzz-qr-cods.p.rapidapi.com/getQrcode',
      params: {
        type: 'text',
        value: paymentHash,
      },
      headers: {
        'X-RapidAPI-Key': '5fcfc1e3b7msh027d64cd7a3c018p122d12jsn207ab85fafe7',
        'X-RapidAPI-Host': 'codzz-qr-cods.p.rapidapi.com',
      },
    }
    const response = await axios.request(options)
    return response.data.url
  } catch (err) {
    console.log(err.response)
  }
}

module.exports = {
  generateQR,
}
