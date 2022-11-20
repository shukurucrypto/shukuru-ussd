const axios = require('axios')
const { fetchCoins } = require('../apiCalls/coins.js')
const { createBTCInvoice } = require('../functions/createBTCInvoice.js')
const { getLightningBalance } = require('../functions/getLightningBalance.js')
// const match = require('conditional-expression').default
const { wallet, getWalletBalance } = require('../functions/wallet.js')
const Menu = require('../models/Menu.js')
const User = require('../models/User.js')
const {
  useMatchEthAmountEntered,
  useMatchNumberEntered,
  useMatchAcceptGasFees,
  getUserPaymentAmount,
  getUserPaymentAmountBefore,
  useRejectGasFees,
  useSelectedBTCToBuy,
  useMatchUSDTAmountEntered,
  useMatchNumberUsdtEntered,
  useSelectedUsdt,
  useMatchAcceptUSDTGasFees,
  useMatchUsdtRecieverNumberEntered,
  useMatchBTCAmountEntered,
  useMatchBTCNumberEntered,
  useMatchAcceptBtcGasFees,
  useMatchAcceptBTCGasQuote,
} = require('../regex/ussdRegex.js')
const {
  createTxState,
  getActiveTx,
  setNextStep,
  removeActiveTx,
  acceptGasFees,
} = require('../utils/createTxState.js')
const { getGasEstimates } = require('../utils/getGasEstimates.js')
const { sendWalletInfo } = require('../utils/getWalletInfo.js')
const { sendBtc } = require('../utils/sendBtc.js')
const { sendEther } = require('../utils/sendEther.js')
const { sendLightningBtc } = require('../utils/sendLightningBTC.js')
const { sendUsdt } = require('../utils/sendUsdt.js')
const { swapCoins, swapCoinsQuote } = require('../utils/swapCoins.js')
const { listenerCount } = require('../models/Menu.js')
const { switchKey } = require('../helpers/helper.js')
const { sendCelloUSD } = require('../utils/sendCelloUSD.js')

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

const markets = async (req, res) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body
    let response = ''

    const user = await User.findOne({ phoneNumber })

    if (!user) {
      createWallet(req, res, phoneNumber, text)
    } else {
      /* 
        The engine function works by returning the menus to be displayed in the ui. It is a giant
        object with functions as with their key value pairs.
        1. The engine() is called while passing in the text info inside it. 
          APssign a text variable, we call the corresponding function key valu pair that matches it.

        */
      const engine = async (entry) => {
        let obj = {
          '': () => {
            // This is the first request. Note how we start the response with CON
            response = `CON Welcome to Shukuru Crypto, What would you like to do?\n`
            response += `1. My Wallet\n`
            response += `2. See Markets`
          },
          '1*1': () => {
            // ============================= MAKE CRYPTO PAYMENTS MENU=============================
            response = `CON Select the coin to pay using\n`
            response += `1. BTC - Bitcoin (Lightning)\n`
            response += `2. ETH - Ethereum*\n`
            response += `3. USDT - Tether\n`
            response += `4. cUSD - Celo Dollar`
          },
          '1*1*1': () => {
            // ################################# SELECT BTC #############################
            // Set the current user's active TX to BTC
            createTxState('BTC', phoneNumber)
            response = `CON Enter the amount of ${user.country} you want to send`
          },
          btcNumber: () => {
            // Number of BTC reciever
            response = `CON Please enter the number of BTC reciever\n`
          },
          confirmBtcGas: async () => {
            // ============================= CONFIRM BTC GAS FEES =============================
            const lightningBalance = await getLightningBalance(phoneNumber)
            if (lightningBalance === 0) {
              response = `END You have Insufficient funds!\n`
              response += `Top-up more BTC to complete your transaction\n`
            } else {
              const paymentAmount = await getUserPaymentAmountBefore(text)
              response = `CON Initialized payment of ${paymentAmount} ${user.country} worth BTC\n`
              // response += `Estimated gas 0.0345 BTC\n`
              response += `1. Confirm \n`
              response += `2. Cancel \n`
            }
          },
          sendBtc: () => {
            sendLightningBtc(text, phoneNumber)
            response = `END Your BTC crypto payment was successfully initialised, Please wait for a confirmation SMS.... \n`
          },
          '1*1*2': () => {
            // ################################# SELECT ETHEREUM #############################

            // ============================= OPTION Selected payment option 2 use ETH =============================
            // Set the user's active asset to ETH here....
            createTxState('ETH', phoneNumber)

            response = `CON Please enter amount of ETH to pay\n`
          },
          ethNumber: () => {
            // Number of ETH reciever
            response = `CON Please enter the number of reciever\n`
          },
          confirmEthGas: async () => {
            const paymentAmount = await getUserPaymentAmountBefore(text)
            // Get the estimated gas fees
            // Switch between the confirmation assets here using the active asset
            const gasPrice = await getGasEstimates(phoneNumber, text)
            response = `CON Initialized payment ${paymentAmount} ETH\n`
            response += `Estimated gas ${gasPrice} GWEI\n`
            response += `1. Confirm \n`
            response += `2. Cancel \n`
          },
          sendEth: () => {
            sendEther(text, phoneNumber)
            // response = txResponse
            response = `END Your crypto payment was successfully initialised, Please wait for a confirmation SMS.... \n`
          },
          '1*1*3': () => {
            // ============================= OPTION Selected payment option 3 use USDT =============================
            createTxState('USDT', phoneNumber)
            response = `CON Please enter amount of USDT to pay\n`
          },
          usdtNumber: () => {
            // Number of ETH reciever
            response = `CON Please enter the number of USDT reciever\n`
          },
          confirmUSDTGas: async () => {
            // ============================= CONFIRM USDT GAS FEES =============================
            // Get the USDT payment amount from the text string
            const paymentAmount = await getUserPaymentAmountBefore(text)
            // Get the estimated gas fees
            const gasPrice = await getGasEstimates(phoneNumber, text)
            response = `CON Initialized payment ${paymentAmount} USDT\n`
            response += `Estimated gas ${gasPrice} GWEI\n`
            response += `1. Confirm \n`
            response += `2. Cancel \n`
          },
          sendUsdt: () => {
            sendEther(text, phoneNumber)
            // response = txResponse
            response = `END Your USDT crypto payment was successfully initialised, Please wait for a confirmation SMS.... \n`
          },                    
          '1*1*4': () => {
            //  PAY WITH CELLO DOLLAR
            response = `CON Please enter the amount of cUSD to pay\n`
          },
          cUsdNumber: () => {
            response = `CON Please enter the number of cUSD reciever\n`
          },
 
          confirmcUSDGas: async () => {
            // ============================= CONFIRM cUSDGAS FEES =============================
            const paymentAmount = await getUserPaymentAmountBefore(text)

            const gasPrice = await getGasEstimates(phoneNumber, text)
            response = `CON Initialized payment ${paymentAmount} USDT\n`
            // response += `Estimated gas of ${gasPrice} cUSD\n`
            response += `1. Confirm \n`
            response += `2. Cancel \n`
          },
          sendcUSD: () => {
            // send
            sendCelloUSD(text, phoneNumber)
            response = `END Your cUSD crypto payment was successfully initialised, Please wait for a confirmation SMS.... \n`
          },
 
          '1*2': () => {
            // ============================= OPTION 1/2 BUY =============================
            response += `CON What do you want to top-up? \n`
            response += `1. BTC (Lightning) \n`
            response += `2. ETH `
            response += `3. cUSD (Celo Dollar)` 
          },
          '1*2*1': () => {
            // ============================= TOP UP BTC =============================
            response = `CON Enter the amount of BTC in ${user.country} to recieve. \n`
          },
          createTopUpInvoice: () => {
            createBTCInvoice(phoneNumber, text)
            response = `END Shuku ${user.name}, We've sent you a invoice to recieve your BTC\n`
          },
          '1*2*2': () => {
            response += `END Thank you for being an early testor. \n`
            response += `Your rewards are on the way\n`
            response += `You can also top-up with your address  \n`
          },
          "1*2*3": () => {
            response += `END Thank you for being an early testor. \n`
            response += `Your rewards are on the way\n`
            response += `You can also top-up with your address  \n`
          },
          '1*3': async () => {
            // ============================= OPTION 3 WALLET INFO =============================
            const walletResponse = await sendWalletInfo(phoneNumber)
            response = walletResponse
          },
          '1*4': async () => {
            // ============================= OPTION 1/4 WALLET BALANCE =============================
            const txResponse = await getWalletBalance(phoneNumber)
            response = txResponse
          },
          '1*5': () => {
            response = `CON Select the coin to swap\n`
            response += `1. ETH to USDT\n`
            response += `2. USDT to ETH\n`
          },
          '1*5*1': () => {
            // ============================= OPTION 1/5/1 SWAP ETH TO USDT =============================
            response = `CON Please enter amount of ETH to swap\n`
          },
          swapEthToUsdtQuote: async () => {
            const quote = await swapCoinsQuote(text, phoneNumber, 'ETH/USDT')

            if (quote.response) {
              response += quote.response
            } else {
              response = `CON You'll get ${Number(quote.buyAmount).toFixed(
                3
              )} USDT \n`
              response += `Gas costs $${Number(quote.estimatedGasPrice).toFixed(
                3
              )}\n`
              response += `-------------------------------\n`

              response += `1. Confirm \n`
              response += `2. Cancel \n`
            }
          },
          swapEthToUsdtConfirmed: () => {
            response = `END Your swap is being processed, please wait for a confirmation SMS...`
            swapCoins(text, phoneNumber, 'ETH/USDT')
          },
          '1*5*2': () => {
            // ============================= OPTION 1/5/2 SWAP USDT TO ETH =============================
            response = `CON Please enter amount of USDT to swap\n`
          },
          swapUsdtToEthQuote: async () => {
            const quote = await swapCoinsQuote(text, phoneNumber, 'USDT/ETH')

            if (quote.response) {
              response += quote.response
            } else {
              response = `CON You'll get ${Number(quote.buyAmount).toFixed(
                6
              )} ETH\n`
              response += `Gas costs $${Number(quote.estimatedGasPrice).toFixed(
                3
              )}\n`
              response += `-------------------------------\n`

              response += `1. Confirm \n`
              response += `2. Cancel \n`
            }
          },
          swapUsdtToEthConfirmed: async () => {
            response = `END Your swap is being processed, please wait for a confirmation SMS...`
            swapCoins(text, phoneNumber, 'USDT/ETH')
          },
          '2*1': async () => {
            // ================= BITCOIN MARKET STATS ==================
            const coin = await fetchCoin('bitcoin')
            response = `END ${
              coin.name
            } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
            response += ` Up ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`
          },
          '2*2': async () => {
            // ================= ETHEREUM MARKET STATS ==================
            const coin = await fetchCoin('ethereum')
            response = `END ${
              coin.name
            } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
            response += ` Up ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`
          },
          '2*3': async () => {
            // ================= USDT MARKET STATS ==================
            const coin = await fetchCoin('tether')
            response = `END ${
              coin.name
            } (${coin.symbol.toUpperCase()}) - $${coin.market_data.current_price.usd.toLocaleString()}\n`
            response += ` Up ${coin.market_data.ath_change_percentage.btc}% last 24hr\n`
          },
        }
        /*
          Before we return the manu, we first pass it through the regex function to see if it was regex matchable
        */

        let mainMenu = (1).toString() // here were just stringifying the main menu entry which is 1 to a string
        obj[mainMenu] = () => {
          response = `CON Would you like to \n`
          response += `1. Make crypto payment \n`
          response += `2. Topup crypto \n`
          response += `3. Wallet info \n`
          response += `4. Wallet Balance \n`
          response += `5. Swap coins \n`
        }

        let marketsMenu = (2).toString()
        obj[marketsMenu] = () => {
          // Showing all the markets menu
          response = `CON Shukuru Top cryptocurrencies\n`
          response += `1. BTC - Bitcoin\n`
          response += `2. ETH - Ethereum\n`
          response += `3. USDT - Stable\n`
        }

        // console.log(entry)
        const result = await switchKey(entry) // This method handles the all the regexes

        if (result) {
          entry = result
        }

        return obj[entry]
      }

      const result = await engine(text)

      if (!result) {
        res.set('Content-Type: text/plain')
        response = `END Invalid entry`
        res.send(response)
        return
      }

      await result()
      res.set('Content-Type: text/plain')
      res.send(response)
    }
  } catch (err) {
    console.log(err.message)
    res.send(err.message)
  }
}

const createWallet = async (req, res, phoneNumber, text) => {
  try {
    // const { sessionId, serviceCode, phoneNumber, text } = req.body
    // Check to see if a user with the phone number exists
    let response = ''

    const user = await User.findOne({ phoneNumber })

    if (user) {
      // User exists
      response = `END A user with this phone already exists.\n`
      res.set('Content-Type: text/plain')
      res.send(response)
      return
    }

    if (text === '') {
      response += `CON Welcome to Shukuru App\n`
      response += `Enter your name to create a crypto wallet\n`
    }

    if (text !== '') {
      response += `CON Enter your wallet PIN\n`
    }

    if (text.includes('*')) {
      const txResponse = await wallet(text, phoneNumber)
      response = txResponse
    }

    // if (text !== '') {
    //   response = `END Your wallet has been created successfully\n`
    //   response += ` We're going to send you a link to secure your account\n`
    // }

    // console.log(text)
    //   console.log(text, phoneNumber, serviceCode, sessionId);
    // Send the response back to the API
    res.set('Content-Type: text/plain')
    res.send(response)
  } catch (err) {
    console.log(err.message)
    res.send(err.message)
  }
}

module.exports = {
  markets,
  createWallet,
}

/*
console.log(sessionId)

    // Create a menu cacher
    const userMenu = await Menu.findOne({ phoneNumber: phoneNumber })

    if (userMenu?.name === 'home' || text === '') {
      response = `CON Welcome to Shukuru Crypto, What would you like to do?\n`
      response += `1. My Wallet\n`
      response += `2. See Markets`
    }

    if (text === '1' && userMenu.name !== 'wallet') {
      // Set the user manu to wallet

      userMenu.name = 'wallet'
      // userMenu.active = true
      userMenu.sessionId = sessionId

      response = `CON Would you like to \n`
      response += `1. Make crypto payment \n`
      response += `2. Topup crypto \n`
      response += `3. Wallet info \n`
      response += `4. Wallet Balance \n`
      response += `5. Swap coins \n`

      // Set the active menu to wallet
      await userMenu.save()
    }

    if (userMenu?.name === 'wallet' && text === '1') {
      response = `CON Would you like to \n`
      response += `1. Make crypto payment \n`
      response += `2. Topup crypto \n`
      response += `3. Wallet info \n`
      response += `4. Wallet Balance \n`
      response += `5. Swap coins \n`
    }

    if (userMenu?.name === 'wallet' && text === '1*1') {
      // ============================= OPTION 1/3 MAKE CRYPTO PAYMENTS =============================
      userMenu.name = 'coin'
      response = `CON Select the coin to pay using\n`
      response += `1. BTC - Bitcoin\n`
      response += `2. ETH - Ethereum*\n`
      response += `3. USDT - Tether\n`
      userMenu.save()
    }

    if (userMenu?.name === 'coin') {
      // ============================= OPTION 1/2/1 ENTER BITCOIN =============================
      response = `CON Please enter amount to buy BTC\n`
    }

    if (userMenu?.name === 'coin' && text.startsWith('1*1*')) {
      // ============================= ENTER BITCOIN NUMBER =============================
      response = `CON Please enter BTC reciever number\n`
    }

    if (!userMenu) {
      // Create a new menu for the user with home
      const newMenu = new Menu({
        phoneNumber: phoneNumber,
        name: 'home',
      })
      newMenu.save()
    }

    if (userMenu && userMenu?.sessionId != sessionId) {
      userMenu.name = 'home'
      userMenu.save()
    }

    console.log(text)
    console.log(userMenu.name)
    // console.log(sessionId)
    // console.log(userMenu?.sessionId)
    // console.log(userMenu)
    // console.log(serviceCode)
    // Send the response back to the API
    */

// if (!obj.hasOwnProperty(entry)) {
//   if (await useMatchBTCAmountEntered(entry)) {
//     obj[entry] = () => {
//       // Number of BTC reciever
//       response = `CON Please enter the number of BTC reciever\n`
//     }
//   }

//   if (await useMatchBTCNumberEntered(entry)) {
//     obj[entry] = async () => {
//       const paymentAmount = await getUserPaymentAmountBefore(text)
//       response = `CON Initialized payment of ${paymentAmount} ${user.country} worth BTC\n`
//       // response += `Estimated gas 0.0345 BTC\n`
//       response += `1. Confirm \n`
//       response += `2. Cancel \n`
//       // ============================= CONFIRM BTC GAS FEES =============================
//       /*
//       const lightningBalance = await getLightningBalance(phoneNumber)
//       if (lightningBalance === 0) {
//         response = `END You have Insufficient funds!\n`
//         response += `Top-up more BTC to complete your transaction\n`
//       } else {
//         const paymentAmount = await getUserPaymentAmountBefore(text)
//         response = `CON Initialized payment of ${paymentAmount} ${user.country} worth BTC\n`
//         // response += `Estimated gas 0.0345 BTC\n`
//         response += `1. Confirm \n`
//         response += `2. Cancel \n`
//       }
//       */
//     }

//     if (await useMatchAcceptBTCGasQuote(entry)) {
//       console.log('Called 3')
//       obj[entry] = () => {
//         // sendBtc(text, phoneNumber)
//         sendLightningBtc(text, phoneNumber)
//         // response = txResponse
//         response = `END Your BTC crypto payment was successfully initialised, Please wait for a confirmation SMS.... \n`
//       }
//     }
//   }
// }
