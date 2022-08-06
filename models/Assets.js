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
  },
  symbol: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
})

const Assets = mongoose.model('Asset', AssetSchema)
module.exports = Assets
