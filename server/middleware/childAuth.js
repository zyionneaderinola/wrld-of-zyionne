const jwt = require('jsonwebtoken')

const childAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.isChild) {
      return res.status(403).json({
        error: 'This route is for Little WRLD accounts only'
      })
    }

    req.child = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = childAuth