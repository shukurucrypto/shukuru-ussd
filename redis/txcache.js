const redisClient = require('../config/redisConfig')

const cacheUserTxs = async (userId, userTxs) => {
  try {
    //   cache logic goes here
    const key = `userTxs:${userId}`
    // Convert the user transactions object to a JSON string
    const value = JSON.stringify(userTxs)
    // Set the key in Redis. You can also specify an expiration time (in seconds) using EX option
    // For example, to have the data expire in 24 hours, you'd use 86400 seconds
    await redisClient.set(key, value, { EX: 86400 })
    console.log(`Cached transactions for user ${userId}`)
  } catch (error) {
    return error
  }
}

const getUserTxCache = async (req, res, next) => {
  const { userId } = req.params
  try {
    const cachedTxs = await redisClient.get(`userTxs:${userId}`)
    if (cachedTxs) {
      const txs = JSON.parse(cachedTxs)
      return res.status(200).json({ success: true, data: txs })
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
  cacheUserTxs,
  getUserTxCache,
}
