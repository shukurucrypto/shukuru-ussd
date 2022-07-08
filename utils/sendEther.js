const ethers = require("ethers");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const { decrypt } = require("../security/encrypt.js");
const { extractPhoneNumber } = require("../regex/ussdRegex.js");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(
  process.env.RINKEBY_RPC_URL
);

//

const sendEther = async userText => {
  try {
    const phoneNumber = extractPhoneNumber(userText);
    const phone = phoneNumber.replace(/^0+/, "");
    console.log("INPUT >>", phoneNumber);
    // console.log("TYPE >>", typeof phoneNumber);
    // const currentUser = await User.findOne({ phoneNumber });
    // const dbPrivateKey = currentUser.passKey;
    // // Sender private key:
    // const privateKey = await decrypt(dbPrivateKey);
    // // address
    // const address = currentUser.address;
    // // wallet
    // console.log("DECRYPTED KEY: ", privateKey);
    // tx object
    // send
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  sendEther,
};
