const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
  evmAddress: {
    type: String,
    required: true,
  },
})

const AdminData = mongoose.model('AdminData', AdminSchema)
module.exports = AdminData
