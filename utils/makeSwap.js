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

  console.log(`signer address: ${signer.address}`)

  // Quote parameters
  const sellToken = sellTokenAddress // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // ETH
  const buyToken = buyTokenAddress // '0x6b175474e89094c44da98b954eedeac495271d0f' // DAI
  const sellAmount = amount
  const takerAddress = signer.address // '0xab5801a7d398351b8be11c439e05c5b3259aec9b' // An account with sufficient balance on mainnet

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

  let tradeToAddress, tradeFromAddress

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

  const SELL_TOKEN_ADDRESS = '0x509Ee0d083DdF8AC028f2a56731412edD63223B9' // USDT Goerli // '0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253' // dai polygon mumbai address
  const ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // Eth Goerli // '0x0000000000000000000000000000000000001010' // matic polygon mumbai address

  try {
    await swap(amount.toString(), ETH_TOKEN_ADDRESS, SELL_TOKEN_ADDRESS, signer)
    // amount, sellTokenAddress, buyTokenAddress, signer

    // await axios
    //   .get(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`)
    //   .then((res) => {
    //     const quote = res.data
    //     console.log(`Quote: ${quote}`)
    //   })
    //   .catch((err) => {
    //     console.log(err.message)
    //   })
    return `END Your swap is being processed, please wait for a confirmation SMS...`
  } catch (error) {
    response = `END An error occurred`
    console.log(error.message)
    return response
  }
}

module.exports = {
  makeSwap,
}
