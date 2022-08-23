const ethers = require('ethers')
const { providerRPCURL } = require('../settings/settings.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')

const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const ABI = require('../abiData/erc20.json')
const { networkConfig } = require('../helper-hardhat-config.js')
const USDT_ADDRESS = networkConfig.usdt.testAddress

const getUsdtBalance = async (phoneNumber) => {
  try {
    const userSigner = await getCurrentUserSigner(phoneNumber)
    const userAddress = await userSigner.getAddress()
    // const usdtAsset = await Assets.findOne()

    const usdtContract = new ethers.Contract(USDT_ADDRESS, ABI, provider)

    const userBalance = usdtContract.balanceOf(userAddress)

    return userBalance
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  getUsdtBalance,
}
