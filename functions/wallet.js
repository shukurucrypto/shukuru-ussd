const { createWalletSigner } = require("../utils/createWallet.js");
const { walletBalance } = require("../utils/walletBalance.js");

async function wallet(userText, phoneNumber) {
  await createWalletSigner(userText, phoneNumber);
}

async function getWalletBalance(phoneNumber) {
  await walletBalance(phoneNumber);
}

module.exports = {
  wallet,
  getWalletBalance,
};
