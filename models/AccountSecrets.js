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
  btc: {
    type: String,
    required: true,
  },
  btcAddress: {
    type: String,
  },
  deezyAccessKey: {
    type: String,
  },
})

const AccountSecrets = mongoose.model('AccountSecrets', AccountSecretsSchema)

module.exports = AccountSecrets
