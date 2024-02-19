const redisClient = require('../config/redisConfig')
const User = require('../models/User')

const userCache = async (req, res, next) => {
  const { userId } = req.params

  try {
    const cachedUser = await redisClient.get(`user:${userId}`)

    if (cachedUser) {
      const user = JSON.parse(cachedUser)
      return res.status(200).json({
        success: true,
        data: user,
      })
    } else {
      const currentUser = await User.findById(userId)

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      await redisClient.set(`user:${userId}`, JSON.stringify(currentUser))

      next()
    }
  } catch (error) {
    console.error(error)
    next()
  }
}

module.exports = {
  userCache,
}
