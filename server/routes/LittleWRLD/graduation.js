const express = require('express')
const router = express.Router()
const Child = require('../../models/LittleWRLD/Child')
const User = require('../../models/User')
const auth = require('../../middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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

// CHECK if child is eligible for graduation
router.get('/check/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const today = new Date()
    const birth = new Date(child.dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    res.json({
      eligible: age >= 21,
      currentAge: age,
      graduatesAt: new Date(
        birth.getFullYear() + 21,
        birth.getMonth(),
        birth.getDate()
      )
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GRADUATE child to main WRLD
router.post('/graduate/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (child.hasGraduated) {
      return res.status(400).json({ error: 'Already graduated to main WRLD' })
    }

    const { email, newPassword } = req.body

    // Check age
    const today = new Date()
    const birth = new Date(child.dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 21) {
      return res.status(400).json({
        error: `${child.displayName} must be 21 to graduate to main WRLD`
      })
    }

    // Check username availability on main WRLD
    const existingUser = await User.findOne({ username: child.username })
    const finalUsername = existingUser
      ? `${child.username}_wrld`
      : child.username

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const friendId = await generateFriendId()

    // Create main WRLD account
    const newUser = new User({
      username: finalUsername,
      email,
      password: hashedPassword,
      displayName: child.displayName,
      friendId,
      bio: `Graduated from Little WRLD 🎓`,
      worlds: [],
      purpose: ['just_having_fun', 'exploring']
    })

    await newUser.save()

    // Mark child as graduated
    child.hasGraduated = true
    child.graduatedAt = new Date()
    child.mainWRLDAccount = newUser._id
    await child.save()

    // Generate token for new account
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: `Welcome to WRLD, ${newUser.displayName}! 🎉 You have graduated from Little WRLD.`,
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        displayName: newUser.displayName,
        friendId: newUser.friendId
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router