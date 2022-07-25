const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

const ussdRouter = require('./routes/ussd.js')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/ussd', ussdRouter)

// Cconnect mongoose to the database
try {
  // Connect to the MongoDB cluster
  mongoose.connect(
    process.env.MONGOOSE_DB_URL,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(' Mongoose is connected')
  )
} catch (e) {
  console.log('could not connect')
}

const dbConnection = mongoose.connection
dbConnection.on('error', (err) => console.log(`Connection error ${err}`))
dbConnection.once('open', () => console.log('Connected to DB!'))

app.listen(8000, () => {
  console.log('Server started on port 8000')
})
