const mongoose = require('mongoose')

const RewardsSchema = new mongoose.Schema({
  receiver: {
    type: String,
  },
  asset: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  claimed: {
    type: Boolean,
    default: false,
  },
  sent: {
    type: Date,
    default: Date.now,
  },
  expires: {
    type: Date,
    // Make rewards expires after 24 hours
    default: function () {
      return new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
  },
})

const Rewards = mongoose.model('Rewards', RewardsSchema)
module.exports = Rewards
