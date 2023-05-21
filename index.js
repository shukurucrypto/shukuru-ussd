const express = require('express')
const mongoose = require('mongoose')
const socketIO = require('socket.io')
const socketio = require('socket.io')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const ussdRouter = require('./routes/ussd.js')
// const { setIO } = require('./setup.js')
const apiRouter = require('./routes/apiRouter.js')

const app = express()
const server = http.createServer(app)

const io = socketio(server)
// const io = setIO(server)

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
app.use('/app', apiRouter)

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

let activeUsers = []

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`)

  socket.on('joinedActive', ({ joinedUser }) => {
    const userExists = activeUsers.some(
      (user) => user.userId === joinedUser.userId
    )

    if (!userExists) {
      // Add the new user to the activeUsers list
      activeUsers.push({ userId: joinedUser.userId, socketId: socket.id })
    } else {
      // If the user already exists, update their socket ID
      const existingUser = activeUsers.find(
        (user) => user.userId === joinedUser.userId
      )
      existingUser.socketId = socket.id
    }
  })

  socket.on('sendTxNotification', ({ recipientId, message }) => {
    // Find the socket ID of the recipient user
    const recipient = activeUsers.find((user) => user.userId === recipientId)

    if (recipient) {
      // Send the message to the recipient only
      io.to(recipient.socketId).emit('txNotification', {
        senderId: socket.id,
        message,
      })
    } else {
      // Handle error if the recipient user is not found
      socket.emit('errorMessage', 'Recipient not found')
    }
  })

  socket.on('join', ({ payhash }) => {
    socket.join(payhash)
    // console.log(`User ${socket.id} is listening to transaction ${payhash}`)
  })

  socket.on('status', ({ payhash, paid }) => {
    io.to(payhash).emit('status', { paid, senderId: socket.id })
  })

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`)
  })
})

const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  console.log('Server started on port 8000')
})
