const axios = require('axios')
const { fetchCoins } = require('../apiCalls/coins.js')
const { wallet, getWalletBalance } = require('../functions/wallet.js')
const User = require('../models/User.js')
const {
  useMatchEthAmountEntered,
  useMatchNumberEntered,
  useMatchAcceptGasFees,
  getUserPaymentAmount,
  getUserPaymentAmountBefore,
  useRejectGasFees,
  useSelectedBTCToBuy,
} = require('../regex/ussdRegex.js')
const { getGasEstimates } = require('../utils/getGasEstimates.js')
const { sendWalletInfo } = require('../utils/getWalletInfo.js')
const { sendEther } = require('../utils/sendEther.js')

const fetchCoin = async (name) => {
  try {
    const result = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${name}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    )
    const data = await result.data
    return data
  } catch (error) {
    console.log(error.message)
  }
}

const otherMarkets = async (req, res) => {
  console.log(`Markets called....`)
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body

    let response = ''

    if (text === '') {
      // This is the first request. Note how we start the response with CON
      response = `CON Welcome to Shukuru Crypto, What would you like to do?\n`
      response += `1. My Wallet\n`
      response += `2. See Markets`
    } else if (text === '1') {
      // const coins = await fetchCoins()
      // ============================= OPTION 1 MY WALLETS =============================
      // ${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}
      // Showing all the markets menu
      response = `CON Would you like to \n`
      // response = `CON Now ${coins[0].market_data.current_price.usd.toLocaleString()}(${coins[0].symbol.toUpperCase()}), ${coins[1].market_data.current_price.usd.toLocaleString()}(${coins[1].symbol.toUpperCase()})\n`
      response += `1. Make crypto payment \n`
      response += `2. Buy crypto \n`
      response += `3. Wallet info \n`
      response += `4. Wallet Balance \n`
    } else if (text === '1*3') {
      // ============================= OPTION 1 WALLET INFO =============================
      const walletResponse = await sendWalletInfo(phoneNumber)
      response = walletResponse
    } else if (text === '1*2') {
      // ============================= OPTION 1/2 BUY =============================
      response = `END Buy crypto coming soon to Shukuru`
      // Showing coins to buy
      //   response = `CON Select coin to buy\n`
      //   response += `1. BTC - Bitcoin\n`
      //   response += `2. ETH - Ethereum\n`
      //   response += `3. USDT - Tether\n`
      // } else if (text === '1*2*1') {
      //   // Selected buy option 1 Buy BTC
      //   response = `CON Please enter amount to buy BTC\n`
      // } else if (text === '1*2*2') {
      //   // Selected buy option 2 Buy ETH
      //   response = `CON Please enter amount to buy ETH\n`
      // } else if (text === '1*2*3') {
      //   // Selected buy option 3 Buy USDT
      //   response = `CON Please enter amount to buy USDT\n`
    } else if (text === '1*1') {
      // ============================= OPTION 1/3 MAKE CRYPTO PAYMENTS =============================
      response = `CON Select the coin to pay using\n`
      response += `1. BTC - Bitcoin\n`
      response += `2. ETH - Ethereum*\n`
      response += `3. USDT - Tether\n`
    } else if (text === '1*1*1') {
      // Selected payment option 1 use BTC
      // response = `CON Please enter amount of BTC to pay\n`
      response = `END BTC coming soon to Shukuru`
    } else if (text === '1*1*2') {
      // Selected payment option 2 use ETH
      response = `CON Please enter amount of ETH to pay\n`
    } else if (text === '1*1*3') {
      // Selected payment option 3 use USDT
      // response = `CON Please enter amount of USDT to pay\n`
      response = `END USDT coming soon to Shukuru`
    } else if (text === '1*4') {
      // ============================= OPTION 1/4 WALLET BALANCE =============================
      const txResponse = await getWalletBalance(phoneNumber)
      response = txResponse
    } else if (useMatchEthAmountEntered(text)) {
      response = `CON Please enter the number of reciever\n`
    } else if (useMatchNumberEntered(text)) {
      // ============================= CONFIRM GAS FEES =============================
      // Get the payment amount from the text string
      const paymentAmount = await getUserPaymentAmountBefore(text)
      // Get the estimated gas fees
      const gasPrice = await getGasEstimates(phoneNumber, text)
      response = `CON Initialized payment ${paymentAmount} ETH\n`
      response += `Estimated gas ${gasPrice} ETH\n`
      response += `1. Confirm \n`
      response += `2. Cancel \n`
    }
    if (useMatchAcceptGasFees(text)) {
      // ============================= SEND ETHEREUM =============================
      const txResponse = await sendEther(text, phoneNumber)
      response = txResponse
    }
    if (useRejectGasFees(text)) {
      // ============================= REJECTED GAS FEES =============================
      response = `END Thank you for using Shukuru Crypto\n`
      // ##############################################################################
      // #######                            SEE MARKETS                       #########
      // #######                             OPTION (2)                       #########
      // ##############################################################################
    } else if (text === '2') {
      // Showing all the markets menu
      response = `CON Shukuru Top cryptocurrencies\n`
      response += `1. BTC - Bitcoin\n`
      response += `2. ETH - Ethereum\n`
      response += `3. USDT - Tether\n`
      // } else if (text === '2*1') {
      //   // Showing BTC coin options
      //   response = `CON BTC - Bitcoin\n`
      //   response += `1. Buy\n`
      //   response += `2. Sell\n`
      //   response += `3. Check balance\n`
      //   response += `4. Market Stats`
    } else if (text === '2*1') {
      // Option 4 to check the BTC market
      const coin = await fetchCoin('bitcoin')
      response = `END ${
        coin.name
      } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
      response += ` Up ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`
      // response += `1. Buy\n`
      // response += `2. Sell\n`
      // } else if (text === '2*2') {
      //   // Business logic for first level response
      //   response = `CON ETH - Ethereum\n`
      //   response += `1. Buy\n`
      //   response += `2. Sell\n`
      //   response += `3. Check balance\n`
      //   response += `4. Market`
    } else if (text === '2*2') {
      // Option 4 to check the ETH market
      const coin = await fetchCoin('ethereum')
      response = `END ${
        coin.name
      } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
      response += ` ${coin.market_data.ath_change_percentage.eth}% last 24hr\n`
      // response += `1. Buy\n`
      // response += `2. Sell\n`
      // } else if (text === '2*3') {
      //   // Business logic for first level response
      //   response = `CON USDT - Tether\n`
      //   response += `1. Buy\n`
      //   response += `2. Sell\n`
      //   response += `3. Check balance\n`
      //   response += `4. Market`
    } else if (text === '2*3') {
      // Option 4 to check the USDT market
      const coin = await fetchCoin('tether')
      response = `END ${
        coin.name
      } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
      response += ` ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`
      // response += `1. Buy\n`
      // response += `2. Sell\n`
    }

    // if (useSelectedBTCToBuy(text)) {
    //   response = `END Buy crypto coming soon to Shukuru`
    // }

    // console.log(text)
    // console.log(serviceCode)
    // Send the response back to the API
    res.set('Content-Type: text/plain')
    res.send(response)
  } catch (err) {
    console.log(err.message)
    res.send(err.message)
  }
}

const createOtherWallet = async (req, res) => {
  console.log(`Create wallet called....`, req)
  try {
    const { sessionId, serviceCode, phoneNumber, userInput } = req.body
    // Check to see if a user with the phone number exists
    let response = ''
    let rep = {
      sessionId: '15794051211',
      message: `Welcome to Shukuru App\n Enter your name to create a crypto wallet\n`,
      ContinueSession: '1',
    }

    // const user = await User.findOne({ phoneNumber });
    // if (user) {
    //   // User exists
    //   response = `END A user with this phone already exists.\n`;
    // }

    // if (text === '') {
    //   response += `CON Welcome to Shukuru App\n`
    //   response += `Enter your name to create a crypto wallet\n`
    // }

    // if (text !== '') {
    //   response += `CON Enter your wallet PIN\n`
    // }

    // if (text.includes('*')) {
    //   const txResponse = await wallet(text, phoneNumber)
    //   response = txResponse
    // }

    // if(text !== '') {
    //     response = `END Your wallet has been created successfully\n`;
    //     response += ` We're going to send you a link to secure your account\n`;
    // }

    // console.log(text)
    //   console.log(text, phoneNumber, serviceCode, sessionId);
    // Send the response back to the API
    // res.set('Content-Type: text/plain')
    res.set('Content-Type: application/json')
    // res.send(response)
    res.send(rep)
  } catch (err) {
    console.log(err.message)
    res.send(err.message)
  }
}

module.exports = {
  otherMarkets,
  createOtherWallet,
}
