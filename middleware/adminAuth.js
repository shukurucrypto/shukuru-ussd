// Import dotenv
require('dotenv').config()

async function authLndNodeAdmin(req, res, next) {
  try {
    const adminKey = req.headers.adminkey

    if (!adminKey) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid admin credentials.' })
    }

    // Use the environment variable
    if (adminKey != process.env.LND_NODE_ADMIN_KEY) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid admin credentials.' })
    }

    next()
  } catch (err) {
    return res.status(401).send('Unauthorized')
  }
}

module.exports = {
  authLndNodeAdmin,
}
