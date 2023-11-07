const mongoose = require('mongoose')

// This creates an OTP User model
const UserOtpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const UserOtp = mongoose.model('UserOtp', UserOtpSchema)
module.exports = UserOtp
