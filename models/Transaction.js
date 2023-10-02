const mongoose = require('mongoose')

// console.log(`Gas Used: ${gasPrice}`);
// console.log(`Tx hash: ${txRecipt.transactionHash}`);
// console.log(`Block Number: ${txRecipt.blockNumber}`);

const TransactionSchema = new mongoose.Schema({
  sender: {
    type: String,
  },
  receiver: {
    type: String,
  },
  asset: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  txType: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  coin: {
    type: String,
    required: false,
  },
  gasUsed: {
    type: String,
    // required: true,
  },
  txHash: {
    type: String,
    // required: true,
  },
  external: {
    type: Boolean,
    required: true,
    default: false,
  },
  blockNumber: {
    type: Number,
    // required: true,
    default: 0,
  },
  status: {
    type: String,
    default: 'PENDING',
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction
