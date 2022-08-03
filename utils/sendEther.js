const ethers = require('ethers')
const User = require('../models/User.js')
const Transaction = require('../models/Transaction.js')
const bcrypt = require('bcrypt')
const { decrypt } = require('../security/encrypt.js')
const sendSMS = require('../SMS/smsFunctions.js')
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
  truncateAddress,
} = require('../regex/ussdRegex.js')
const { providerRPCURL } = require('../settings/settings.js')
require('dotenv').config()

// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RINKEBY_RPC_URL
// );
const provider = new ethers.providers.JsonRpcProvider(providerRPCURL)

const sendEther = async (userText, phoneNumber) => {
  /* 
    This function is called in the ussd menu -> send ether 1*4 passing in the entered text and current phone number which is the payer
    Using the phoneNumber, we query the db and get the user's info and decrypt the pk using the crypto library
     
   */
  let response
  try {
    // console.log("User Text is: ", userText);
    // Get the current user / payer

    const currentUser = await User.findOne({ phoneNumber })

    // get the reciver's contact from the userText
    const paidUserPhoneNumber = await extractPhoneNumber(userText)

    // get the amount to be paid
    const amount = await getUserPaymentAmount(userText)
    // console.log('Amount is: ', amount)
    const userPhone = await getUserToPayPhoneNumber(userText)

    // Format the return phone and append a country code to it
    // const convertedPhone = userPhone.toString()
    // const paidUserPhone = convertedPhone.replace(/^0+/, '')
    // const paidUserPhone = convertedPhone.replace(/^0+/, '+256')
    // const convertedPhone = userPhone.toString()
    const paidUserPhone = userPhone.replace(/^0+/, '')

    // console.log("AMOUNT: ", paidUserPhone);
    const convertedPhoneToNumber = Number(paidUserPhone)

    // First get reciever's data thats in the db
    // const reciever = await User.findOne({ phoneNumber: paidUserPhone })
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

    const gasPrice = await provider.getGasPrice()
    const ethGasPrice = ethers.utils.hexlify(gasPrice)

    console.log(`Current gas price: ${ethGasPrice}`)

    // create their wallet
    // console.log("PAYER'S DECRYPTED KEY: ", privateKey);
    // console.log("PAYER'S ADDRESS: ", currentUser);
    // //
    // console.log("RECIEVER'S ADDRESS: ", reciever);
    // console.log("AMOUNT: ", amount);

    // tx object
    const tx = {
      from: currentUser.address,
      to: recieverAddress,
      value: ethers.utils.parseEther(amount),
    }

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey)

    // sign the tx
    await wallet.signTransaction(tx)

    // connect to the provider
    const signedWallet = await wallet.connect(provider)

    // get wallet balance
    const walletBalance = await signedWallet.getBalance()

    const convertedBalance = await ethers.utils.formatEther(walletBalance)

    if (convertedBalance === 0.0 || convertedBalance === 0) {
      response = `END Payment Failed\n`
      response += `Make sure you have enough ETH in your wallet\n`
      return response
    }
    let txRecipt
    // send
    const result = await signedWallet.sendTransaction(tx)

    txRecipt = await result.wait(1)

    // console.log('TX RECIPT: ------------------', txRecipt)

    if (txRecipt.status === 1 || txRecipt.status === '1') {
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

    // update both the users wallet balances in the db
    const payerNewBalance = await provider.getBalance(currentUser.address)
    const payerNewBalanceFormatted = await ethers.utils.formatEther(
      payerNewBalance
    )
    await User.findOneAndUpdate(
      { phoneNumber: currentUser.phoneNumber },
      { balance: payerNewBalanceFormatted }
    )
    const recieverNewBalance = await provider.getBalance(reciever.address)
    const recieverNewBalanceFormatted = await ethers.utils.formatEther(
      recieverNewBalance
    )
    await User.findOneAndUpdate(
      { phoneNumber: paidUserPhone },
      { balance: recieverNewBalanceFormatted }
    )

    // const gasPrice = await ethers.utils.formatEther(txRecipt.gasUsed.toString())

    // Create a Transaction model for the transaction
    const newTransaction = new Transaction({
      sender: currentUser.phoneNumber.toString(),
      receiver: reciever.phoneNumber.toString(),
      amount: amount,
      coin: 'ETH',
      gasUsed: gasPrice,
      txHash: txRecipt.transactionHash,
      blockNumber: txRecipt.blockNumber,
    })

    await newTransaction.save()

    response = `END ETH payment to ${paidUserPhone} has been initiated\n`
    response += `Wait for an SMS confirmation\n`
    return response
  } catch (error) {
    console.log('DEBUG HERE: -------------------------', error.message)

    response = `END Payment Failed\n`
    response += `Make sure you have enough ETH in your wallet\n`
    return response
  }
}

module.exports = {
  sendEther,
}
