const ethers = require('ethers')
const qs = require('qs')
const axios = require('axios')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const Assets = require('../models/Assets.js')
const { getCoin } = require('../apiCalls/getCoin.js')
const { erc20Contract } = require('../abiData/abiData.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const swap = async (amount, sellTokenAddress, buyTokenAddress, signer) => {
  const ABI = erc20Contract

  console.log(`sellToken address: ${sellTokenAddress}`)
  console.log(`buyToken address: ${buyTokenAddress}`)

  // Quote parameters
  const sellToken = sellTokenAddress
  const buyToken = buyTokenAddress
  const sellAmount = amount
  const takerAddress = signer.address

  const quoteResponse = await axios.get(
    `https://api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellAmount=${sellAmount}&sellToken=${sellToken}&takerAddress=${takerAddress}`
  )
  // Check for error from 0x API
  if (quoteResponse.status !== 200) {
    const body = await quoteResponse.text()
    throw new Error(body)
  }

  const quote = await quoteResponse.data

  // Get a signer for the account we are impersonating
  // const signer = await provider.getSigner(takerAddress)
  const dai = new ethers.Contract(buyToken, ABI, signer)

  console.log(`Signer / taker Address ${signer.address}`)
  console.log(`Swap to contract address ${dai.address}`)

  // Get pre-swap balances for comparison
  const etherBalanceBefore = await signer.getBalance()
  const daiBalalanceBefore = await dai.balanceOf(takerAddress)

  console.log(`Taker ETH balance before swap ${etherBalanceBefore}`)
  console.log(`Taker DAI balance before swap ${daiBalalanceBefore}`)

  console.log(
    `----------------------START SWAPING THE TX-----------------------------`
  )

  // Send the transaction
  const txResponse = await signer.sendTransaction({
    from: quote.from,
    to: quote.to,
    data: quote.data,
    value: ethers.BigNumber.from(quote.value || 0),
    gasPrice: ethers.BigNumber.from(quote.gasPrice),
    gasLimit: ethers.BigNumber.from(quote.gas),
  })

  // Wait for transaction to confirm
  const txReceipt = await txResponse.wait()

  console.log(`Transaction ${txReceipt.hash}`)
  console.log(
    `----------------------END SWAPING THE TX-----------------------------`
  )

  // Get post-swap balances
  const etherBalanceAfter = await signer.getBalance()
  const daiBalanceAfter = await dai.balanceOf(takerAddress)

  console.log(
    `ETH: ${etherBalanceBefore.toString()} -> ${etherBalanceAfter.toString()}`
  )
  console.log(
    `DAI: ${daiBalalanceBefore.toString()} -> ${daiBalanceAfter.toString()}`
  )
}

const makeSwap = async (tokenFrom, tokenTo, amount, phoneNumber) => {
  let response

  let tradeToAddress, tradeFromAddress, SELL_TOKEN_ADDRESS, BUY_TOKEN_ADDRESS

  // get token from address from assets
  const tokenFromAsset = await Assets.findOne({ symbol: tokenFrom })

  const tokenToAsset = await Assets.findOne({ symbol: tokenTo })

  console.log('----------------------SWAPPING COINS CALLED--------------------')

  const signer = await getCurrentUserSigner(phoneNumber)

  //   We need to validate that none of the swap coins is ETH because ethereum doesnot have a smart contract address,
  //   therefore coingeko won't return the ETH data because it does not have it
  //   if (tokenFrom != 'ETH') {
  //     const fromToken = await getCoin(tokenFrom)
  //     tradeFromAddress = fromToken.address
  //   } else {
  //     tradeFromAddress = tokenFrom
  //   }

  //   if (tokenTo != 'ETH') {
  //     const toToken = await getCoin(tokenTo)
  //     tradeToAddress = toToken.address
  //   } else {
  //     tradeToAddress = tokenTo
  //   }

  //   const convertedAmount = amount * 10 ** tokenFrom.decimals

  const params = {
    sellToken: tokenFrom,
    buyToken: tokenTo,
    sellAmount: amount.toString(),
  }

  if (tokenFrom === 'ETH') {
    SELL_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  } else {
    SELL_TOKEN_ADDRESS = tokenFromAsset?.address?.live
  }

  BUY_TOKEN_ADDRESS = tokenToAsset?.address?.live

  try {
    await swap(amount.toString(), SELL_TOKEN_ADDRESS, BUY_TOKEN_ADDRESS, signer)

    return `END Swapping will go live on mainnet soon...`
  } catch (error) {
    response = `END An error occurred`
    console.log(error.message)
    return response
  }
}

module.exports = {
  makeSwap,
}
