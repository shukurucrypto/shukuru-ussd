const mongoose = require('mongoose')

const UserTransactionsSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  ],
})

const UserTransactions = mongoose.model(
  'UserTransactions',
  UserTransactionsSchema
)
module.exports = UserTransactions
