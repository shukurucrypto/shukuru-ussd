const express = require('express')
const mongoose = require('mongoose')
const socketIO = require('socket.io')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const ussdRouter = require('./routes/ussd.js')
const { setIO } = require('./setup.js')

const app = express()
const server = http.createServer(app)

const io = setIO(server)

// const io = socketIO(server, {
//   cors: {
//     origin: '*',
//     credentials: true,
//   },
// })

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set('io', io)
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

io.on('connection', (socket) => {
  console.log('New User connected')

  // socket.emit('newSession', {
  //   from: '256700719619',
  //   code: 'Main Menu',
  // })

  socket.on('createMessage', (msg) => {
    console.log(msg)
  })

  socket.on('disconnected', () => {
    console.log('Disconnected user')
  })
})

const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  console.log('Server started on port 8000')
})
