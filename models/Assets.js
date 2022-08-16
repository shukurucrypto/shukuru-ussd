const mongoose = require('mongoose')

const AssetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: false,
  },
  symbol: {
    type: String,
    required: true,
    unique: false,
  },
  balance: {
    type: Number,
    required: true,
  },
  address: {
    live: {
      type: String,
    },
    test: {
      type: String,
    },
  },
})

const Assets = mongoose.model('Asset', AssetSchema)
module.exports = Assets
