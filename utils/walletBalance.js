const ethers = require("ethers");
const User = require("../models/User.js");
const sendSMS = require("../SMS/smsFunctions.js");
const bcrypt = require("bcrypt");
require("dotenv").config();
// const provider = ethers.getDefaultProvider();

// const credentials = {
//   apiKey: process.env.AFRICA_TALKING_API_KEY,
//   username: process.env.AFRICA_TALKING_APP_USERNAME,
// };

async function walletBalance(phoneNumber) {
  // const provider = new ethers.providers.InfuraProvider(
  //   "rinkeby",
  //   process.env.INFURA_SECRET
  // );
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RINKEBY_RPC_URL
  );

  try {
    const currentUser = await User.findOne({ phoneNumber });
    let userBalance;

    if (currentUser) {
      const balance = await provider.getBalance(currentUser.address);

      userBalance = ethers.utils.formatEther(balance);
      // update the wallet balance in the db
      currentUser.balance = userBalance;
      await currentUser.save();

      await sendSMS(
        `Your wallet ${currentUser.address} balance is ${userBalance} ETH`,
        phoneNumber
      );
    } else {
      console.log("User does not exist");
      return;
    }
  } catch (err) {
    console.log(err.message);
  }
  // get user from the database
}

module.exports = {
  walletBalance,
};
