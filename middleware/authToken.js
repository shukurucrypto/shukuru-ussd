const jwt = require('jsonwebtoken')
require('dotenv').config()

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']

  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(403).json({ success: false, message: 'Not Authorized.' })
  }

  const cleanedToken = token.replace(/"/g, '')

  try {
    // Verify the token and get the decoded payload
    const decoded = jwt.verify(cleanedToken, process.env.ENCRYPTION_KEY)

    // Set the user object on the request for use in downstream middleware and routes
    req.user = decoded

    // Call the next middleware or route handler
    next()
  } catch (err) {
    return res.status(401).send('Unauthorized')
  }
}

module.exports = {
  authenticateToken,
}
