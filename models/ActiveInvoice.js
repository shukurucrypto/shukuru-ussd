const mongoose = require('mongoose')

const ActiveInvoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const ActiveInvoice = mongoose.model('ActiveInvoice', ActiveInvoiceSchema)
module.exports = ActiveInvoice
