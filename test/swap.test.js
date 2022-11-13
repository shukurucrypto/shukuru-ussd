const { expect } = require('chai')
const axios = require('axios')
const { ethers } = require('hardhat')
const { erc20Contract } = require('../abiData/abiData')

const AMOUNT = ethers.utils.parseEther('1.0')
const ABI = erc20Contract

describe('0x API Intergratiom', function () {
  it('it should be able to use a 0x API mainnet quote', async function () {
    // Quote parameters
    const sellToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // ETH
    const buyToken = '0x6b175474e89094c44da98b954eedeac495271d0f' // DAI
    const sellAmount = ONE_ETHER_BASE_UNITS
    const takerAddress = '0xab5801a7d398351b8be11c439e05c5b3259aec9b'

    const quoteResponse = await fetch(
      `https://api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellAmount=${sellAmount}&sellToken=${sellToken}&takerAddress=${takerAddress}`
    )

    // Check for error from 0x API
    if (quoteResponse.status !== 200) {
      const body = await quoteResponse.text()
      throw new Error(body)
    }

    const quote = await quoteResponse.json()
  })
})
