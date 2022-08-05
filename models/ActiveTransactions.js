const mongoose = require('mongoose')

const ActiveTransactionsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  asset: {
    name: String,
  },
  completed: {
    type: Boolean,
    default: false,
  },
})

const ActiveTransactions = mongoose.model(
  'ActiveTransactions',
  ActiveTransactionsSchema
)
module.exports = ActiveTransactions
