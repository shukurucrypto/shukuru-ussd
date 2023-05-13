const mongoose = require('mongoose')

const NfcCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tagNo: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const NfcCard = mongoose.model('NfcCard', NfcCardSchema)
module.exports = NfcCard
