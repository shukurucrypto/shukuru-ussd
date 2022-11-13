const ethers = require('ethers')
const User = require('../models/User.js')
const { getUserPaymentAmountForGasFees } = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
const sendSMS = require('../SMS/smsFunctions.js')
require('dotenv').config()

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const getGasEstimates = async (userPhone, text) => {
  try {
    const feeData = await provider.getFeeData()
    const gasPrice = ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei')
    // We need to get the user's address
    // const currentUser = await User.findOne({ phoneNumber: userPhone })
    // const gasInEther = ethers.utils.parseEther(feeData.gasPrice.toString())

    // get user amount
    // const amount = await getUserPaymentAmountForGasFees(text)
    // const gasPrice = await provider.getGasPrice()

    // const gasCost = ethers.utils.formatEther(gasPrice)
    // const estimate = await provider.estimateGas({
    //   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    //   value: ethers.utils.parseEther(amount),
    // })

    // const gasPrice = ethers.utils.formatUnits(estimate, 'gwei')

    // // const estimateInEth = ethers.utils.formatEther(estimate)
    return gasPrice.toString()
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  getGasEstimates,
}
