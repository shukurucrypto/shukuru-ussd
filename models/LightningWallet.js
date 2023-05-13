const mongoose = require('mongoose')

const LightningWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  i_id: {
    type: String,
    required: true,
    unique: false,
  },
  adminKey: {
    type: String,
    required: true,
    unique: false,
  },
  inKey: {
    type: String,
    required: true,
    unique: false,
  },
  walletId: {
    type: String,
  },
})

const LightningWallet = mongoose.model('LightningWallet', LightningWalletSchema)
module.exports = LightningWallet
