const mongoose = require("mongoose");

// console.log(`Gas Used: ${gasPrice}`);
// console.log(`Tx hash: ${txRecipt.transactionHash}`);
// console.log(`Block Number: ${txRecipt.blockNumber}`);

const TransactionSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  coin: {
    type: String,
    required: false,
  },
  gasUsed: {
    type: String,
    required: true,
  },
  txHash: {
    type: String,
    required: true,
  },
  blockNumber: {
    type: Number,
    required: true,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = Transaction;
