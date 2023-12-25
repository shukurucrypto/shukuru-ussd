const { default: axios } = require('axios')
const CC = require('currency-converter-lt')

const currencyConvertorForUtilities = async (
  amount,
  currencyFrom,
  currencyTo
) => {
  try {
    if (Number(amount) <= 0) {
      return Number(amount)
    }

    if (currencyFrom === currencyTo) {
      return Number(amount)
    }

    let currencyConverter = new CC({
      from: currencyFrom,
      to: currencyTo,
      amount: Number(amount),
    })

    let convertedAmount = await currencyConverter.convert(Number(amount))

    return convertedAmount.toString()
  } catch (error) {
    console.log(error.response)
    return error.response
  }
}

const currencyConvertor = async (
  amount,
  currencyFrom,
  currencyTo,
  isUtility
) => {
  try {
    if (Number(amount) <= 0) {
      return Number(amount)
    }

    // Convert the utitlity amount to USD
    if (isUtility) {
      return await currencyConvertorForUtilities(amount, currencyFrom, 'USD')
    }

    if (currencyFrom === currencyTo) {
      return Number(amount)
    }

    let currencyConverter = new CC({
      from: currencyFrom,
      to: currencyTo,
      amount: Number(amount),
    })

    let convertedAmount = await currencyConverter.convert(Number(amount))

    return convertedAmount.toString()
  } catch (error) {
    console.log(error.response)
    return error.response
  }
}

const satsConvertor = async (sats, userCurrency) => {
  try {
    const satsAmount = await getSatsToUSD(sats)

    let convertedSats

    if (Number(satsAmount) > 0) {
      convertedSats = await currencyConvertor(satsAmount, 'USD', userCurrency)
    }

    return Number(convertedSats)
  } catch (error) {
    return error.message
  }
}

const getSatsToUSD = async (satsAmount) => {
  try {
    // Step 1: Get the latest BTC price in USDT
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    )

    if (response.data && response.data.bitcoin) {
      const btcToUSDPrice = parseFloat(response.data.bitcoin.usd)

      // Step 2: Convert SATs to BTC
      const btcAmount = satsAmount / 100000000 // 100,000,000 SATs in 1 BTC

      // Step 3: Calculate the USD value
      const usdAmount = btcAmount * btcToUSDPrice

      return usdAmount
    } else {
      // throw new Error('Unable to fetch BTC price from Binance API')
      return 'Unable to fetch BTC price from Binance API'
    }
  } catch (error) {
    // new Error('Error converting SATs to USD: ' + error.message)
    return 'Error converting SATs to USD: ' + error.message
  }
}

module.exports = {
  currencyConvertor,
  satsConvertor,
}
