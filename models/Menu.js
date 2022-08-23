const mongoose = require('mongoose')

const MenuSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
  },
  name: {
    type: String,
  },
  active: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
  },
})

const Menu = mongoose.model('Menu', MenuSchema)
module.exports = Menu
