const { default: axios } = require('axios')
const CC = require('currency-converter-lt')

const currencyConvertor = async (amount, currencyFrom, currencyTo) => {
  // let convertedAmount = 0
  // try {
  if (Number(amount) <= 0) {
    return Number(amount)
  }

  let currencyConverter = new CC({
    from: currencyFrom,
    to: currencyTo,
    amount: Number(amount),
  })

  let convertedAmount = await currencyConverter.convert(Number(amount))

  console.log('1 ====================================')
  console.log(convertedAmount)
  console.log('====================================')

  // await currencyConverter.convert(Number(amount)).then((response) => {
  //   convertedAmount = response
  // })

  return convertedAmount.toString()
  // } catch (error) {
  // console.log(error.response)
  // return error.response
  // }
}

const satsConvertor = async (sats, userCurrency) => {
  // try {
  const satsAmount = await getSatsToUSD(sats)

  console.log('SATS AMOUNT ====================================')
  console.log(satsAmount)
  console.log('====================================')

  let convertedSats

  if (Number(satsAmount) > 0) {
    convertedSats = await currencyConvertor(satsAmount, 'USD', userCurrency)
  }

  console.log('2 ====================================')
  console.log(convertedSats)
  console.log('====================================')

  return Number(convertedSats)
  // } catch (error) {
  //   console.log('INSIDE 2====================================')
  //   console.log('ERROR:', error)
  //   console.log('====================================')
  //   return error.message
  // }
}

const getSatsToUSD = async (satsAmount) => {
  try {
    // Step 1: Get the latest BTC price in USDT
    const response = await axios.get(
      'https://api.binance.com/api/v3/ticker/price',
      {
        params: { symbol: 'BTCUSDT' },
      }
    )

    if (response.data && response.data.price) {
      const btcToUSDPrice = parseFloat(response.data.price)

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
