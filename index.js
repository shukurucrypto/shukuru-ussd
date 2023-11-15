const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const bodyParser = require('body-parser')
const socketIOInitializer = require('./events/socket.js')
const cors = require('cors')
require('dotenv').config()

const ussdRouter = require('./routes/ussd.js')
const apiRouter = require('./routes/apiRouter.js')

const app = express()
const server = http.createServer(app)

const io = socketIOInitializer(server)

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set('io', io)
app.use('/ussd', ussdRouter)
app.use('/app', apiRouter)

try {
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

const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  console.log('Server started on port 8000')
})
