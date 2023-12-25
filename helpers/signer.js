const ethers = require('ethers')
const User = require('../models/User')
const { decrypt } = require('../security/encrypt')
const {
  celo,
  polygon,
  bnb,
  celoProviderUrl,
  bscProviderURL,
} = require('../settings/settings')
const ContractKit = require('@celo/contractkit')
const { currencyConvertor } = require('../utils/currencyConvertor')
const Web3 = require('web3')

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const provider = new ethers.providers.JsonRpcProvider(bscProviderURL)
const celoProvider = new ethers.providers.JsonRpcProvider(celoProviderUrl)

const createSigner = async (userId, network) => {
  try {
    // let provider

    const currenctUser = await User.findById(userId)

    const privateKey = await decrypt(currenctUser.passKey)

    const provider = getProvider(network)

    const signer = await new ethers.Wallet(privateKey, provider)

    return signer
  } catch (error) {
    return error
  }
}

const getProvider = (network) => {
  switch (network) {
    case 'celo':
      return new ethers.providers.JsonRpcProvider(celo)

    case 'polygon':
      return new ethers.providers.JsonRpcProvider(polygon)

    case 'bnb':
      return new ethers.providers.JsonRpcProvider(bnb)

    // Main nets

    default:
      return new ethers.providers.JsonRpcProvider(celo)
  }
}

const sendcUSDKit = async (sender, receiver, amount) => {
  try {
    let cUSDtoken = await kit.contracts.getStableToken()

    console.log('====================================')
    console.log(sender)
    console.log('====================================')

    // This lines will convert the cUSD balance from the user's local currency back to USD
    const convertedToUSDAmount = await currencyConvertor(
      amount,
      sender.country,
      'USD'
    )

    console.log('TO USD ====================================')
    console.log(convertedToUSDAmount, amount)
    console.log('====================================')

    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount_ = parsedAmount.toString()

    // Get the current user / payer passkey
    const dbPrivateKey = sender.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // await kit.setFeeCurrency(ContractKit.CeloContract.StableToken)

    // tx object
    await kit.connection.addAccount(privateKey)

    // await kit.setFeeCurrency(ContractKit.CeloContract.StableToken)

    // tx object
    // await kit.connection.addAccount(privateKey)

    // get wallet balance
    const walletBalance = await cUSDtoken.balanceOf(sender.address)

    const convertedBalance = await ethers.utils.formatEther(
      walletBalance.toString()
    )

    console.log('====================================')
    console.log(convertedBalance)
    console.log('====================================')

    if (Number(convertedBalance) <= 0) {
      return 'Insufficent cUSD balance'
    }

    // SENDING
    if (receiver.address) {
      const result = await cUSDtoken
        .transfer(receiver.address, amount_)
        .send({ from: sender.address, feeCurrency: cUSDtoken.address })

      let txRecipt = await result.waitReceipt()
      return txRecipt
    } else {
      const result = await cUSDtoken
        .transfer(receiver, amount_)
        .send({ from: sender.address, feeCurrency: cUSDtoken.address })

      let txRecipt = await result.waitReceipt()
      return txRecipt
    }
  } catch (error) {
    console.log('====================================')
    console.log(error)
    console.log('====================================')
    return error
  }
}

module.exports = {
  createSigner,
  getProvider,
  sendcUSDKit,
}
