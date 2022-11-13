const axios = require('axios')
const { ENVIRONMENT } = require('../settings/settings')
const network = ENVIRONMENT === 'testnet' ? 'BTCTEST' : 'BTC'

const getBTCBalance = async (address) => {
  try {
    const result = await axios.get(
      `https://sochain.com/api/v2/get_address_balance/${network}/${address}`
    )
    return result.data
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getBTCBalance,
}
