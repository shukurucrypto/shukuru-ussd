const { createWalletSigner } = require("../utils/createWallet.js");
const { walletBalance } = require("../utils/walletBalance.js");

async function wallet(userText, phoneNumber) {
  const response = await createWalletSigner(userText, phoneNumber);
  return response;
}

async function getWalletBalance(phoneNumber) {
  const response = await walletBalance(phoneNumber);
  return response;
}

module.exports = {
  wallet,
  getWalletBalance,
};
