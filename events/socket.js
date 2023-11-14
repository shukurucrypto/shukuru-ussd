const socketIO = require('socket.io')

const initializeSocket = (server) => {
  const io = socketIO(server)

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
    })

    socket.on('status', ({ payhash, paid }) => {
      io.to(payhash).emit('status', { paid, senderId: socket.id })
    })

    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`)
    })
  })

  return io
}

module.exports = initializeSocket
