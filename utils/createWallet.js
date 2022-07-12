const ethers = require("ethers");
const User = require("../models/User.js");

const { encrypt } = require("../security/encrypt.js");
const {
  getCreateUserWalletInfo,
  truncateAddress,
} = require("../regex/ussdRegex.js");
const sendSMS = require("../SMS/smsFunctions.js");
require("dotenv").config();

// const provider = new ethers.providers.InfuraProvider(
//   "rinkeby",
//   process.env.INFURA_SECRET
// );

const provider = new ethers.providers.JsonRpcProvider(process.env.HARDHAT_RPC);

async function createWalletSigner(userText, phoneNumber) {
  let response;
  try {
    const currentUser = await User.findOne({ phoneNumber });
    if (currentUser) {
      response = `END Hi, ${currentUser.name}!\n`;
      response += `You already have a Shukuru crypto wallet.\n`;
      response += `Address: ${truncateAddress(currentUser.address)}\n`;
      return response;
    } else {
      // Check to see if the user already has a wallet
      const { name, walletPin } = await getCreateUserWalletInfo(userText);

      // Lets first encrypt the walletPin
      const encryptedWalletPin = await encrypt(walletPin);

      const wallet = await ethers.Wallet.createRandom();
      // check if user with this phoneNumber exists

      const createdWallet = await new ethers.Wallet(
        wallet.privateKey,
        provider
      );
      const encryptedPassKey = await encrypt(wallet.privateKey);
      const encryptedMnemonic = await encrypt(wallet.mnemonic.phrase);
      // // save the wallet to the database
      const user = new User({
        name: name,
        walletPin: encryptedWalletPin,
        phoneNumber: phoneNumber,
        address: createdWallet.address,
        passKey: encryptedPassKey,
        mnemonic: encryptedMnemonic,
      });
      const res = await user.save();
      if (res) {
        await sendSMS(
          `Welcome to Shukuru ${name}, your crypto wallet of address ${truncateAddress(
            createdWallet.address
          )} was successfully created`,
          phoneNumber
        );
      }
      response = `END Your wallet was successfully created\n`;
      response += `Please wait for a confirmation SMS\n`;
      return response;
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  createWalletSigner,
};
