const ethers = require("ethers");
const sendSMS = require("../SMS/smsFunctions.js");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.HARDHAT_RPC);

const fundTestWallets = async recieverAddress => {
  try {
    const amount = ethers.utils.parseEther("100");

    const tx = {
      to: recieverAddress,
      value: ethers.utils.parseEther("100"),
    };

    const privateKey =
      "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0";

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
        `You have sent ${amount} ETH to ${recieverAddress}`,
        "+256700719619"
      );
    } else {
      await sendSMS(
        `You dont have enough balance to pay ${amount} ETH to ${paidUserPhone}`,
        "+256700719619"
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  fundTestWallets,
};
