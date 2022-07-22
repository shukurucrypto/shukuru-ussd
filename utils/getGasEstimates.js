const ethers = require('ethers')
const User = require('../models/User.js')
const { getUserPaymentAmountForGasFees } = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const sendSMS = require('../SMS/smsFunctions.js')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const getGasEstimates = async (userPhone, text) => {
  try {
    // We need to get the user's address
    // const currentUser = await User.findOne({ phoneNumber: userPhone })

    // get user amount
    const amount = await getUserPaymentAmountForGasFees(text)

    // const estimate = await provider.getGasPrice()
    const estimate = await provider.estimateGas({
      to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      value: ethers.utils.parseEther(amount),
    })
    const gasPrice = await ethers.utils.formatUnits(estimate, 'gwei')

    // console.log("Estimate is: ", gasPrice.toString());
    return gasPrice.toString()
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  getGasEstimates,
}
