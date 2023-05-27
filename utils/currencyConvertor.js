const { default: axios } = require('axios')
const CC = require('currency-converter-lt')

const currencyConvertor = async (amount, currencyFrom, currencyTo) => {
  let convertedAmount = 0
  try {
    if (Number(amount) <= 0) {
      return Number(amount)
    }

    let currencyConverter = new CC({
      from: currencyFrom,
      to: currencyTo,
      amount: Number(amount),
    })

    await currencyConverter.convert(Number(amount)).then((response) => {
      convertedAmount = response
    })

    return convertedAmount.toString()
  } catch (error) {
    // console.log(error.response)
    return error.response
  }
}
const satsConvertor = async (sats, userCurrency) => {
  try {
    // Convert sats to BTC
    const btc = sats / 100000000

    // Convert to BTC to USD
    const exchangeRate = 26669.855
    const usdAmount = btc * exchangeRate

    if (Number(usdAmount) > 0) {
      convertedSats = await currencyConvertor(usdAmount, 'USD', userCurrency)
    }
    return Number(convertedSats)
  } catch (error) {
    return error.message
  }
}

module.exports = {
  currencyConvertor,
  satsConvertor,
}
