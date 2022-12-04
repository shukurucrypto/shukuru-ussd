
const ethers = require('ethers')
const User = require('../models/User.js')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const Web3 = require("web3")
const ContractKit = require('@celo/contractkit')
const {
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const { providerRPCURL, celoProviderUrl } = require('../settings/settings.js')
const { currencyConvertor } = require('./currencyConvertor.js')
require('dotenv').config()

const web3 = new Web3(celoProviderUrl)
const kit = ContractKit.newKitFromWeb3(web3)

const sendCelloUSD = async (userText, phoneNumber) => {
  /* 
    This function is called in the ussd menu -> send ether 1*4 passing in the entered text and current phone number which is the payer
    Using the phoneNumber, we query the db and get the user's info and decrypt the pk using the crypto library
     
   */
  let response
  try {
    // console.log("User Text is: ", userText);
    // Get the current user / payer

    let cUSDtoken = await kit.contracts.getStableToken()

    const currentUser = await User.findOne({ phoneNumber })

    // get the amount to be paid
    const amount_ = await getUserPaymentAmount(userText)

    // convert the currency back to USD
    const convertedToUSDAmount = await currencyConvertor(amount_, currentUser.country, "USD")
    const parsedAmount = await ethers.utils.parseEther(convertedToUSDAmount)

    const amount = parsedAmount.toString() 

    const userPhone = await getUserToPayPhoneNumber(userText)

    const paidUserPhone = userPhone.replace(/^0+/, '')

    // console.log("AMOUNT: ", paidUserPhone);
    const convertedPhoneToNumber = Number(paidUserPhone)

    const reciever = await User.findOne({
      phoneNumber: { $regex: convertedPhoneToNumber, $options: 'i' },
    })

    if (!reciever) {
      response = `END Payment Failed\n`
      response += `The user does not have a Shukuru Wallet\n`
      return response
    }

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey)

    // Get the reciever's address from db
    const recieverAddress = reciever.address

    // tx object
   await kit.connection.addAccount(privateKey)

    // get wallet balance
    const walletBalance = await cUSDtoken.balanceOf(currentUser.address)

    const convertedBalance = await ethers.utils.formatEther(walletBalance.toString())


    if (convertedBalance === 0.0 || convertedBalance === 0) {
      response = `END Payment Failed\n`
      response += `Make sure you have enough ETH in your wallet\n`
      return response
    }
    let txRecipt
    // send
    // const result = await signedWallet.sendTransaction(tx)
   const result = await cUSDtoken.transfer(recieverAddress, amount).send({from: currentUser.address})


    // txRecipt = await result.wait(1)
    txRecipt = await result.waitReceipt()



    if (txRecipt.status){
      await sendSMS(
        `You have successfully sent ${amount} ETH to ${
          reciever.phoneNumber
        }. Address: ${truncateAddress(recieverAddress)}`,
        currentUser.phoneNumber
      )

      await sendSMS(
        `You have recived ${amount} ETH from ${
          currentUser.phoneNumber
        }. Address: ${truncateAddress(currentUser.address)}`,
        reciever.phoneNumber
      )
    } else {
      await sendSMS(
        `You dont have enough balance to pay ${amount} ETH to ${paidUserPhone}`,
        currentUser.phoneNumber
      )
    }

    response = `END ETH payment to ${paidUserPhone} has been initiated\n`
    response += `Wait for an SMS confirmation\n`
    return response
  } catch (error) {
    response = `END Payment Failed\n`
    response += `Make sure you have enough ETH in your wallet\n`
    return response
  }
}

module.exports = {
  sendCelloUSD,
}
