const ethers = require('ethers')
const qs = require('qs')
const axios = require('axios')
const { providerRPCURL } = require('../settings/settings.js')
require('dotenv').config()

const getSwapPrices = async (tokenFrom, tokenTo, amount) => {
  let response

  let tradeFrom, tradeTo, params

  console.log('----------------------CALLED--------------------')

  if (tokenFrom === 'ETH') {
    tradeFrom = {
      symbol: 'ETH',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Ether',
      decimals: 18,
    }

    tradeTo = {
      symbol: 'USDT',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Tether USD',
      decimals: 6,
    }

    params = {
      sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      buyToken: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      //   sellAmount: 1000000000000000000,
      sellAmount: amount * 10 ** 18,
      //   takerAddress: walletAddress,
      //   slippagePercentage: 0.03,
      skipValidation: true,
    }
  } else {
    tradeFrom = {
      symbol: 'USDT',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Tether USD',
      decimals: 6,
    }

    tradeTo = {
      symbol: 'ETH',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Ether',
      decimals: 18,
    }

    params = {
      sellToken: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      //   sellAmount: 1000000000000000000,
      sellAmount: amount * 10 ** 6,
      //   takerAddress: walletAddress,
      //   slippagePercentage: 0.03,
      skipValidation: true,
    }
  }
  // 8.288335
  try {
    let estimatedGasPrice

    const res = await axios.get(
      `https://arbitrum.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    )

    if (tokenFrom === 'ETH') {
      estimatedGasPrice = res.data.estimatedGas / 10 ** tradeTo.decimals
    } else {
      estimatedGasPrice = res.data.estimatedGas / 10 ** tradeFrom.decimals
    }

    const buyAmount = res.data.buyAmount / 10 ** tradeTo.decimals

    return {
      estimatedGasPrice,
      buyAmount,
    }
  } catch (error) {
    response = `END An error occurred`
    console.log(error.response.data)
    return response
  }
}

const getSwapQuote = async (tokenFrom, tokenTo, amount) => {
  let response

  let tradeFrom, tradeTo, params

  console.log('----------------------CALLED--------------------')

  if (tokenFrom === 'ETH') {
    tradeFrom = {
      symbol: 'ETH',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Ether',
      decimals: 18,
    }

    tradeTo = {
      symbol: 'USDT',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Tether USD',
      decimals: 6,
    }

    params = {
      sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      buyToken: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      //   sellAmount: 1000000000000000000,
      sellAmount: amount * 10 ** 18,
      //   takerAddress: walletAddress,
      //   slippagePercentage: 0.03,
      skipValidation: true,
    }
  } else {
    tradeFrom = {
      symbol: 'USDT',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Tether USD',
      decimals: 6,
    }

    tradeTo = {
      symbol: 'ETH',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Ether',
      decimals: 18,
    }

    params = {
      sellToken: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      //   sellAmount: 1000000000000000000,
      sellAmount: amount * 10 ** 6,
      //   takerAddress: walletAddress,
      //   slippagePercentage: 0.03,
      skipValidation: true,
    }
  }
  // 8.288335
  try {
    const res = await axios.get(
      `https://arbitrum.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    )
    return res.data
  } catch (error) {
    response = `END An error occurred`
    console.log(error.response.data)
    return response
  }
}

module.exports = {
  getSwapQuote,
  getSwapPrices,
}
