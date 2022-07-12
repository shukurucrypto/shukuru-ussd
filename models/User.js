const mongoose = require("mongoose");

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
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
