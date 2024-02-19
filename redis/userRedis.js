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
