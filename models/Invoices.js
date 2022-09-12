const mongoose = require('mongoose')

const InvoicesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentHash: {
    type: String,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
const Invoices = mongoose.model('Invoices', InvoicesSchema)
module.exports = Invoices
