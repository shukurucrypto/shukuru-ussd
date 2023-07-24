const mongoose = require('mongoose')

const StreamSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
  },
  assert: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Stream = mongoose.model('Stream', StreamSchema)
module.exports = Stream
