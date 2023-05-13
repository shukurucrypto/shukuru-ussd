const jwt = require('jsonwebtoken')

function accessTokenBearer(req, res, next) {
  const authHeader = req.headers['authorization']

  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(403).json({ success: false, message: 'Not Authorized.' })
  }

  jwt.verify(token, process.env.ENCRYPTION_KEY, (err) => {
    if (err) return res.sendStatus(403)
    // req.user = user
    next()
  })
}

module.exports = accessTokenBearer
