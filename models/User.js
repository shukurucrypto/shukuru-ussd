const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    // required: true,
  },
  walletPin: {
    type: String,
    // required: true,
  },
  address: {
    type: String,
    // required: true,
  },
  passKey: {
    type: String,
    // required: true,
  },
  mnemonic: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
  wrappedChains: {
    ethereum: {
      type: String,
      default: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    },
    polygon: {
      type: String,
      default: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    },
  },
})

const User = mongoose.model('User', UserSchema)
module.exports = User
