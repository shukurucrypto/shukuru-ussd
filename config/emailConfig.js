const nodemailer = require('nodemailer')
require('dotenv').config()

const passkey = process.env.EMAIL_PASSKEY

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use the name of your email service (e.g., 'Gmail')
  auth: {
    user: 'jovanmwesigwa79@gmail.com', // Your email address
    pass: passkey, // Your email password
  },
})

module.exports = transporter
