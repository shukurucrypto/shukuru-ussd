const { getIO } = require('../setup')

const sendSessionSocket = () => {
  try {
    getIO().emit('newSession', {
      from: '256700719619',
      code: 'Main Menu',
    })
  } catch (error) {
    console.log(error.response)
  }
}

const newSignup = (user) => {
  try {
    getIO().emit('newSignUp', {
      user: user,
    })
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  sendSessionSocket,
  newSignup,
}
