const axios = require('axios')
const { ethers } = require('ethers')
const Invoices = require('../models/Invoices')

const getCoin = async (coin) => {
  let selectedCoin

  try {
    const result = await axios.get(
      `https://tokens.coingecko.com/uniswap/all.json`
    )
    //   return the first 3
    const data = await result.data.tokens
    data.forEach((token) => {
      if (token.name === coin || token.symbol === coin) {
        selectedCoin = token
      }
    })
    return selectedCoin
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

const getCoinAPI = async (req, res) => {
  let selectedCoin
  const coin = 'WETH'
  console.log(`coin 1--------------- ${coin}`)

  try {
    const result = await axios.get(
      `https://tokens.coingecko.com/uniswap/all.json`
    )
    //   return the first 3
    const data = await result.data.tokens
    data.forEach((token) => {
      if (token.name === coin || token.symbol === coin) {
        selectedCoin = token
      }
    })
    console.log(`coin 2--------------- ${selectedCoin.logoURI}`)
    res.send(selectedCoin)
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

const getSwapQuoteAPI = async (req, res) => {
  let selectedCoin
  const params = {
    sellToken: 'ETH',
    buyToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    sellAmount: ethers.utils.parseEther('0.45'),
  }

  try {
    const result = await axios.get(
      `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    )
    //   return the first 3
    const data = await result.data.tokens
    data.forEach((token) => {
      if (token.name === coin || token.symbol === coin) {
        selectedCoin = token
      }
    })
    console.log(`coin 2--------------- ${selectedCoin}`)
    res.send(selectedCoin)
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

const getQRCode = async (req, res) => {
  try {
    // console.log(req.params)

    // const codeData = req.params.id
    // if (!codeData) {
    //   return res.send('<h6>No QR code found!')
    // }

    // res.send(codeData)
    return res.send('<p>Hi</p>')
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  getCoin,
  getCoinAPI,
  getQRCode,
}
