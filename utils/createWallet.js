const ethers = require("ethers");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const { encrypt } = require("../security/encrypt.js");
require("dotenv").config();
// const provider = ethers.getDefaultProvider(); // "hardhat" or "ethers.js"

const saltRounds = 10;

async function createWalletSigner(userText, phoneNumber) {
  const provider = new ethers.providers.InfuraProvider(
    "rinkeby",
    process.env.INFURA_SECRET
  );

  try {
    // const signer =  ethers.Wallet.createRandom();
    const wallet = await ethers.Wallet.createRandom();
    // console.log("address:", wallet.address);
    // console.log("mnemonic:", wallet.mnemonic.phrase);
    // const provider = await ethers.getDefaultProvider();

    // check if user with this phoneNumber exists
    const currentUser = await User.findOne({ phoneNumber });
    if (currentUser) {
      return;
    } else {
      const createdWallet = await new ethers.Wallet(
        wallet.privateKey,
        provider
      );
      // console.log("mnemonic:", wallet.mnemonic.phrase);
      // console.log("address:", createdWallet.address);
      console.log("privateKey:", wallet.privateKey);

      const salt = await bcrypt.genSalt(saltRounds);
      const encryptedMnemonic = await encrypt(wallet.privateKey);
      const encryptedPassKey = await encrypt(wallet.mnemonic.phrase);

      // // save the wallet to the database
      const user = new User({
        phoneNumber: phoneNumber,
        address: createdWallet.address,
        passKey: encryptedPassKey,
        mnemonic: encryptedMnemonic,
      });
      await user.save();

      console.log("Encrypted Mnemonic:", encryptedMnemonic);
      console.log("Encrypted Passkey:", encryptedPassKey);
      console.log("Wallet address:", createdWallet.address);
      // console.log("Provider:", provider);
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  createWalletSigner,
};
