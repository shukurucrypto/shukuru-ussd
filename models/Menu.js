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
})

const Menu = mongoose.model('Menu', MenuSchema)
module.exports = Menu
