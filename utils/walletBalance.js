const ethers = require("ethers");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const provider = ethers.getDefaultProvider();
// const provider = new ethers.providers.InfuraProvider(
//   "rinkeby",
//   process.env.INFURA_SECRET
// );

async function walletBalance(phoneNumber) {
  // get user from the database
  const currentUser = await User.findOne({ phoneNumber });
  if (currentUser) {
    const balance = await provider.getBalance(currentUser.address);
    const etherBalance = ethers.utils.formatEther(balance);
    console.log("User already exists", etherBalance);
  }
}

module.exports = {
  walletBalance,
};
