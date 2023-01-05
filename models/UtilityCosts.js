const mongoose = require('mongoose')

const UtilityCostSchema = new mongoose.Schema({
  type: {
    type: String,
  },
  package: {
    type: String,
    required: true,
  },
  countryCurrency: {
    type: String,
  },
  network: {
    type: String,
  },
  cost: {
    type: Number,
    default: 0,
    required: true,
  },
})

const UtilityCosts = mongoose.model('UtilityCosts', UtilityCostSchema)
module.exports = UtilityCosts
