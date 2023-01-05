const ethers = require('ethers')
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
  getUserSwapAmount,
} = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const Assets = require('../models/Assets.js')
const { getSwapQuote, getSwapPrices } = require('./getSwapQuote.js')
const { makeSwap } = require('./makeSwap.js')
const ERC20_ABI = require('../abiData/erc20.json')
// const { useUniswapTokens } = require('../functions/swapTokensWithUniswap.js')
const { swapTokenRouter } = require('./swapTokenRouter.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')
const { getArbiSigner } = require('../functions/getArbiSigner.js')
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)
const ZERO_EX_ADDRESS = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'

const swapCoins = async (userText, phoneNumber, swap) => {
  let response
  try {
    const currentUser = await User.findOne({ phoneNumber })

    const amount = await getUserSwapAmount(userText)

    // const swapAmount = ethers.utils.parseEther(amount)

    if (!currentUser) {
      response = `END You do not have a wallet yet`
      return response
    }

    const signer = await getArbiSigner(phoneNumber)

    // Check to see if the user has enough balances

    // Check to see if the user has enough ETH to swap
    if (swap === 'ETH/USDT') {
      const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

      const balance = await getBalance(signer.address)

      if (balance === 0) {
        response = `You have Insufficient ETH!`
        await sendSMS(response, phoneNumber)
        return
      }

      // const tx = await getSwapQuote('ETH', 'USDT', amount)
      const tx = await getSwapQuote('MATIC', 'USDT', amount)

      const txObj = {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gasPrice: tx.gasPrice,
        gasLimit: ethers.utils.hexlify(1000000),
      }

      await approve(ethAddress, signer)

      const sentTx = await signer.sendTransaction(txObj)
      await sentTx.wait(1)
    }

    // Check to see if the user has enough USDT to swap
    if (swap === 'USDT/ETH') {
      const usdtAddress = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'

      const balance = await getTokenToBalance(
        signer.address,
        usdtAddress,
        signer
      )

      if (balance === 0) {
        response = `You have Insufficient USDT!`
        await sendSMS(response, phoneNumber)
        return
      }

      // const tx = await getSwapQuote('USDT', 'ETH', Number(amount).toFixed(6))
      const tx = await getSwapQuote('USDT', 'MATIC', Number(amount).toFixed(6))

      const txObj = {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gasPrice: tx.gasPrice,
        gasLimit: ethers.utils.hexlify(1000000),
      }

      await approve(usdtAddress, signer)

      const sentTx = await signer.sendTransaction(txObj)
      await sentTx.wait(1)

      response = `Your swap was successfull!`
      // await sendSMS(response, phoneNumber)
      return response
    }
  } catch (err) {
    response = `END An error occurred`
    console.log(err.message)
    return response
  }
}

const swapCoinsQuote = async (userText, phoneNumber, swap) => {
  let response
  let enteredAmount
  try {
    const amount = await getUserSwapAmount(userText)

    const swapAmount = ethers.utils.parseEther(amount)
    const signer = await getArbiSigner(phoneNumber)

    // Check to see if the user has enough ETH to swap
    if (swap === 'ETH/USDT') {
      const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

      const balance = await getBalance(signer.address)

      if (balance === 0) {
        response = `END You have Insufficient ETH!\n`
        response += `Top-up to complete your swap\n`
        const msg = {
          response: response,
        }
        return msg
      }

      // const swapQuote = await getSwapPrices('ETH', 'USDT', amount)
      const swapQuote = await getSwapPrices('MATIC', 'USDT', amount)
      return swapQuote
    }

    // // Check to see if the user has enough USDT to swap
    if (swap === 'USDT/ETH') {
      const usdtAddress = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'

      const balance = await getTokenToBalance(
        signer.address,
        usdtAddress,
        signer
      )

      if (balance === 0) {
        response = `END You have Insufficient USDT!\n`
        response += `Top-up USDT to complete your swap`
        const msg = {
          response: response,
        }
        return msg
      }

      // const swapQuote = await getSwapPrices(
      //   'USDT',
      //   'ETH',
      //   Number(amount).toFixed(6)
      // )
      const swapQuote = await getSwapPrices(
        'USDT',
        'MATIC',
        Number(amount).toFixed(6)
      )
      return swapQuote
    }
  } catch (err) {
    response = `END An error occurred`
    console.log(err.message)
    return response
  }
}

const approve = async (tokenFromAddress, signer) => {
  try {
    const erc20Contract = new ethers.Contract(
      tokenFromAddress,
      ERC20_ABI,
      signer
    )
    const approvalAmount = ethers.utils.parseUnits('1', 18).toString()

    const tx = await erc20Contract.approve(ZERO_EX_ADDRESS, approvalAmount)
    await tx.wait(1)
    console.log('Approved!')
  } catch (error) {
    console.log(error.response)
  }
}

const getBalance = async (walletAddress) => {
  const balance = await provider.getBalance(walletAddress)
  const formattedBalance = balance.toString() / 10 ** 18
  return formattedBalance
}

const getTokenToBalance = async (walletAddress, tokenAddress, signer) => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  const balance = await contract.balanceOf(walletAddress)

  const formattedBalance = balance.toString() / 10 ** 18
  return formattedBalance
}

module.exports = {
  swapCoins,
  swapCoinsQuote,
}
