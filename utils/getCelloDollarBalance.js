const { celoProviderUrl } = require('../settings/settings.js')
const { getCurrentUserSigner } = require('../functions/getCurrentUserSigner.js')

const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const getCelloDollarBalance = async (phoneNumber) => {
  try {
    const userSigner = await getCurrentUserSigner(phoneNumber)

    let cUSDtoken = await kit.contracts.getStableToken()

    const balance = await cUSDtoken.balanceOf(userSigner.address)
    // console.log(`${userSigner.address} Balance here----> ${balance.toString()}`)

    return balance.toString()
  } catch (err) {
    console.log(err.message)
    return err.message
  }
}

module.exports = {
  getCelloDollarBalance,
}
