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
const { useUniswapTokens } = require('../functions/swapTokensWithUniswap.js')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const MINIMAL_ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
]

const swap = async (amount, sellTokenAddress, buyTokenAddress, signer) => {
  const ABI = erc20Contract

  const params = {
    sellToken: sellTokenAddress,
    buyToken: buyTokenAddress.live,
    sellAmount: amount, // 1 ETH = 10^18 wei
    takerAddress: '0xf977814e90da44bfa03b6295a0616a897441acec',
    // takerAddress: signer.address,
  }

  const quoteResponse = await axios.get(
    `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
  )

  // Check for error from 0x API
  if (quoteResponse?.status !== 200) {
    const body = await quoteResponse.text()
    throw new Error(body)
  }

  const quote = await quoteResponse.data

  /*

    IMPORTANT: READ THIS:
    
    Inorder to create the price quote, we MUST use the coin's address on the LIVE network. IT DOES NOT WORK WITH TESTNET ADDRESSES.
    But since we are using the testnet for development, we'll use the testnet addresses for the swap. and well hardcode them in the ethers.Contract
    constructor. This is because the 0x API does not support testnet addresses.

    When you're ready to deploy to mainnet, you'll need to change the addresses to the live addresses. in the ethers.Contract function.
*/

  // Get a signer for the account we are impersonating
  // const signer = await provider.getSigner(takerAddress)
  const ercContract = new ethers.Contract(
    // params.buyToken, // In development, we use the live address
    buyTokenAddress.test, // When testing, use the testnet address
    MINIMAL_ERC20_ABI,
    signer
  )

  // Get pre-swap balances for comparison
  const etherBalanceBefore = await signer.getBalance()
  const userBuyAssetBalance = await ercContract.balanceOf(signer.address)

  console.log(
    `----------------------START SWAPING THE TX-----------------------------`
  )

  console.log(`Signer / taker Address ${signer.address}`)
  console.log(`Swap to contract address ${ercContract.address}`)

  // Send the transaction
  const txResponse = await signer.sendTransaction(quote)

  // Wait for transaction to confirm
  const txReceipt = await txResponse.wait()

  console.log(`Transaction ${txReceipt.hash}`)
  console.log(
    `----------------------END SWAPING THE TX-----------------------------`
  )

  // Get post-swap balances
  const etherBalanceAfter = await signer.getBalance()
  const daiBalanceAfter = await dai.balanceOf(signer.address)

  console.log(
    `ETH: ${etherBalanceBefore.toString()} -> ${etherBalanceAfter.toString()}`
  )
  console.log(
    `ASSET: ${daiBalalanceBefore.toString()} -> ${daiBalanceAfter.toString()}`
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
    SELL_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // ethereum address
    // SELL_TOKEN_ADDRESS = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' // Polygon address of wrapped ETH
  } else {
    SELL_TOKEN_ADDRESS = tokenFromAsset?.address?.live
  }

  BUY_TOKEN_ADDRESS = tokenToAsset?.address

  try {
    await swap(amount.toString(), SELL_TOKEN_ADDRESS, BUY_TOKEN_ADDRESS, signer)
    // await useUniswapTokens(signer)

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
