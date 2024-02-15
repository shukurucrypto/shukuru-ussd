const dotenv = require('dotenv')

dotenv.config()

const BOLT_APIURL = 'https://muun-production.up.railway.app/api'
// const BOLT_APIURL =  'http://localhost:9000/api'

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
const DEFAULT_REDIS_EXPIRATION = 3600

module.exports = {
  BOLT_APIURL,
  ONESIGNAL_APP_ID,
  DEFAULT_REDIS_EXPIRATION,
}
