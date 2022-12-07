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
    console.log(error.response)
  }
}

module.exports = {
  currencyConvertor,
}
