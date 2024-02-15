const dotenv = require('dotenv')
dotenv.config()

const redis = require('redis')

// Connect to Redis
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  url: process.env.REDIS_URL,
})

module.exports = redisClient
