const axios = require('axios')

const getUserCurrency = async (phoneNumber) => {
  try {
    const callingCode = phoneNumber.substring(1, 4)
    const response = await axios.get(
      `https://restcountries.com/v2/callingcode/${callingCode}`
    )
    const currency = response.data[0].currencies[0].code
    return currency
  } catch (err) {
    console.log(err.message)
  }
}

module.exports = {
  getUserCurrency,
}
