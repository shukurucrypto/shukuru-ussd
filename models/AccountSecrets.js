const mongoose = require('mongoose')

const AccountSecretsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eth: {
    type: String,
    required: true,
  },
  bolt: { type: String },
  btc: {
    type: String,
  },
  deezyAccessKey: {
    type: String,
  },
})

const AccountSecrets = mongoose.model('AccountSecrets', AccountSecretsSchema)

module.exports = AccountSecrets
