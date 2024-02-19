const redisClient = require('../config/redisConfig')
const { DEFAULT_REDIS_EXPIRATION } = require('../constants')
const UserTransactions = require('../models/UserTransactions')

const cachAllUsertx = async (userId) => {
  const transactions = await UserTransactions.findOne({
    user: userId,
  }).populate({
    path: 'transactions',
    options: { sort: { date: 'desc' } },
  })

  // Add the reciever's transaction to the reciver's cache transaction
}

module.exports = {
  cachAllUsertx,
}
