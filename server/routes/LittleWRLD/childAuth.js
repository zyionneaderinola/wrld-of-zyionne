const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Child = require('../../models/LittleWRLD/Child')
const User = require('../../models/User')
const ActivityLog = require('../../models/LittleWRLD/ActivityLog')
const auth = require('../../middleware/auth')

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// PARENT creates a Little WRLD account for their child
router.post('/create', auth, async (req, res) => {
  try {
    const {
      username,
      displayName,
      dateOfBirth,
      password,
      interests,
      contentRating
    } = req.body

    // Verify parent account exists
    const parent = await User.findById(req.user.id)
    if (!parent) {
      return res.status(404).json({ error: 'Parent account not found' })
    }

    // Check age
    const age = calculateAge(dateOfBirth)
    if (age >= 21) {
      return res.status(400).json({
        error: 'Little WRLD is for users under 21'
      })
    }

    // Check username availability
    const existing = await Child.findOne({ username })
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Set content rating based on age automatically
    let autoContentRating = 'all_ages'
    if (age >= 13) autoContentRating = 'ages_13_plus'
    else if (age >= 10) autoContentRating = 'ages_10_plus'
    else if (age >= 6) autoContentRating = 'ages_6_plus'

    const child = new Child({
      parentAccount: req.user.id,
      username,
      displayName,
      dateOfBirth,
      age,
      password: hashedPassword,
      interests: interests || [],
      contentRating: contentRating || autoContentRating
    })

    await child.save()

    // Log activity
    await ActivityLog.create({
      child: child._id,
      parent: req.user.id,
      activityType: 'login',
      description: 'Little WRLD account created by parent'
    })

    res.status(201).json({
      message: `Little WRLD account created for ${displayName}`,
      child: {
        id: child._id,
        username: child.username,
        displayName: child.displayName,
        age: child.age,
        contentRating: child.contentRating
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CHILD logs into Little WRLD
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const child = await Child.findOne({ username })
    if (!child) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, child.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check screen time limit
    const now = new Date()
    const lastReset = new Date(child.screenTime.lastUsageReset)
    const isNewDay = now.toDateString() !== lastReset.toDateString()

    if (isNewDay) {
      child.screenTime.todayUsageMinutes = 0
      child.screenTime.lastUsageReset = now
      await child.save()
    }

    if (child.screenTime.todayUsageMinutes >=
      child.screenTime.dailyLimitMinutes) {
      return res.status(403).json({
        error: 'Daily screen time limit reached. Come back tomorrow!',
        screenTime: child.screenTime
      })
    }

    // Check time of day restrictions
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const startTime = parseInt(
      child.screenTime.sessionStartTime.replace(':', '')
    )
    const endTime = parseInt(
      child.screenTime.sessionEndTime.replace(':', '')
    )

    if (currentTime < startTime || currentTime > endTime) {
      return res.status(403).json({
        error: `Little WRLD is available between ${child.screenTime.sessionStartTime} and ${child.screenTime.sessionEndTime}`,
      })
    }

    const token = jwt.sign(
      { id: child._id, username: child.username, isChild: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    // Log activity
    await ActivityLog.create({
      child: child._id,
      parent: child.parentAccount,
      activityType: 'login',
      description: `${child.displayName} logged into Little WRLD`
    })

    res.json({
      token,
      child: {
        id: child._id,
        username: child.username,
        displayName: child.displayName,
        age: child.age,
        avatar: child.avatar,
        interests: child.interests,
        appearance: child.appearance,
        points: child.points,
        badges: child.badges,
        screenTime: child.screenTime,
        parentalControls: child.parentalControls
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router