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
    if (currentUser) {
      const balance = await provider.getBalance(currentUser.address);
      const etherBalance = ethers.utils.formatEther(balance);
      // console.log("User already exists", etherBalance);
      // update the wallet balance in the db
      currentUser.balance = etherBalance;
      await currentUser.save();

      await sendSMS(
        `Your wallet balance is ${etherBalance} ETH`,
        "+256704719619"
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
