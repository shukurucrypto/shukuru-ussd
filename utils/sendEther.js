const ethers = require("ethers");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const { decrypt } = require("../security/encrypt.js");
const sendSMS = require("../SMS/smsFunctions.js");
const {
  extractPhoneNumber,
  getUserPaymentAmount,
  getUserToPayPhoneNumber,
} = require("../regex/ussdRegex.js");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(
  process.env.RINKEBY_RPC_URL
);

//

const sendEther = async (userText, phoneNumber) => {
  /* 
    This function is called in the ussd menu -> send ether 1*4 passing in the entered text and current phone number which is the payer
    Using the phoneNumber, we query the db and get the user's info and decrypt the pk using the crypto library
     
   */
  try {
    // console.log("User Text is: ", userText);
    // Get the current user / payer
    const currentUser = await User.findOne({ phoneNumber });

    // get the reciver's contact from the userText
    const paidUserPhoneNumber = await extractPhoneNumber(userText);

    // get the amount to be paid
    const amount = await getUserPaymentAmount(userText);
    const userPhone = await getUserToPayPhoneNumber(userText);

    // Format the return phone and append a country code to it
    const convertedPhone = userPhone.toString();
    const paidUserPhone = convertedPhone.replace(/^0+/, "+256");

    // console.log("AMOUNT: ", paidUserPhone);

    // First get reciever's data thats in the db
    const reciever = await User.findOne({ phoneNumber: paidUserPhone });

    if (!reciever) {
      console.log("The reciver is not a Shukuru user");
      return;
    }

    // Get the current user / payer passkey
    const dbPrivateKey = currentUser.passKey;

    // Decrypt the passKey
    const privateKey = await decrypt(dbPrivateKey);

    // Get the reciever's address from db
    const recieverAddress = reciever.address;

    // create their wallet
    // console.log("PAYER'S DECRYPTED KEY: ", privateKey);
    // console.log("PAYER'S ADDRESS: ", currentUser);
    // //
    // console.log("RECIEVER'S ADDRESS: ", reciever);
    // console.log("AMOUNT: ", amount);

    // tx object
    const tx = {
      to: recieverAddress,
      value: ethers.utils.parseEther(amount),
    };

    // payer's wallet
    const wallet = await new ethers.Wallet(privateKey);

    // sign the tx
    await wallet.signTransaction(tx);

    // connect to the provider
    const signedWallet = await wallet.connect(provider);

    // get wallet balance
    const walletBalance = await signedWallet.getBalance();

    const convertedBalance = await ethers.utils.formatEther(walletBalance);

    if (convertedBalance === 0.0) {
      console.log("User has no balance to pay");
      return;
    }

    // send
    const result = await signedWallet.sendTransaction(tx);

    const txRecipt = await result.wait(1);

    if (txRecipt.status === 1 || txRecipt.status === "1") {
      await sendSMS(
        `You have received ${amount} ETH from ${currentUser.phoneNumber}`,
        currentUser.phoneNumber
      );

      await sendSMS(
        `You have sent ${amount} ETH to ${paidUserPhone}`,
        paidUserPhone
      );
    } else {
      await sendSMS(
        `You dont have enough balance to pay ${amount} ETH to ${paidUserPhone}`,
        currentUser.phoneNumber
      );
    }
    // console.log("Wallet balance --------------", txRecipt);

    let response = `END ETH payment to ${paidUserPhone} has been initiated\n`;
    response += `Wait for an SMS confirmation\n`;
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  sendEther,
};
