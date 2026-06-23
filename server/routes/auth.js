const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const generateFriendId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let isUnique = false
  let friendId

  while (!isUnique) {
    let id = 'WRLD#'
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    friendId = id
    const existing = await User.findOne({ friendId })
    if (!existing) isUnique = true
  }

  return friendId
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName, worlds, interests, careerProfile, purpose } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique Friend ID
    const friendId = await generateFriendId()

    // Create user
   // Inside register route, when creating the user:
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      friendId,
      worlds: worlds || [],
      interests: interests || [],
      purpose: purpose || ['just_having_fun'],
      careerProfile: {
      sector: careerProfile?.sector || '',
      role: careerProfile?.role || '',
      experience: careerProfile?.experience || 'not_sure',
      skills: careerProfile?.skills || [],
      open_to_opportunities: careerProfile?.open_to_opportunities || false
      }
    })
    await newUser.save()

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        avatar: newUser.avatar,
        verified: newUser.verified,
        friendId: newUser.friendId
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body

    // Find by email or username
    const existingUser = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    })

    if (!existingUser) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, existingUser.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: existingUser._id, username: existingUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        displayName: existingUser.displayName,
        avatar: existingUser.avatar,
        verified: existingUser.verified,
        friendId: existingUser.friendId
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET current user (protected)
router.get('/me', async (req, res) => {
  try {
    const auth = require('../middleware/auth')
    const foundUser = await User.findById(req.user.id).select('-password')
    res.json(foundUser)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router