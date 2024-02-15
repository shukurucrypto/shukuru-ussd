const redisClient = require('../config/redisConfig')

const userCache = async (req, res, next) => {
  const { userId } = req.params

  try {
    const cachedUser = await redisClient.get(`user:${userId}`)

    if (cachedUser) {
      const user = JSON.parse(cachedUser)
      return res.status(200).json({ user })
    } else {
      console.log('Cache miss')
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
