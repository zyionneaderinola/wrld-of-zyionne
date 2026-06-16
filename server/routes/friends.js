const express = require('express')
const router = express.Router()
const User = require('../models/User')
const auth = require('../middleware/auth')
const { getIO } = require('../socket')

// SEND friend request via Friend ID
router.post('/request', auth, async (req, res) => {
  try {
    const { friendId } = req.body

    const targetUser = await User.findOne({ friendId })
    if (!targetUser) {
      return res.status(404).json({ error: 'No user found with that Friend ID' })
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot add yourself' })
    }

    // Check if already friends or pending
    const currentUser = await User.findById(req.user.id)

    const alreadyFriends = currentUser.friends.some(
      f => f.user.toString() === targetUser._id.toString()
    )

    if (alreadyFriends) {
      return res.status(400).json({ error: 'Friend request already sent or already friends' })
    }

    // Check if blocked
    if (targetUser.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({ error: 'Unable to send friend request' })
    }

    // Add pending to both users
    currentUser.friends.push({
      user: targetUser._id,
      status: 'pending'
    })

    targetUser.friends.push({
      user: req.user.id,
      status: 'pending'
    })

    await currentUser.save()
    await targetUser.save()

    // Notify target user via Socket.io
    const io = getIO()
    io.to(targetUser._id.toString()).emit('friendRequest', {
      from: {
        id: req.user.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar
      }
    })

    res.json({ message: 'Friend request sent' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ACCEPT friend request
router.patch('/accept', auth, async (req, res) => {
  try {
    const { userId } = req.body

    const currentUser = await User.findById(req.user.id)
    const requestingUser = await User.findById(userId)

    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update status to accepted for both
    const currentFriend = currentUser.friends.find(
      f => f.user.toString() === userId
    )
    const requestingFriend = requestingUser.friends.find(
      f => f.user.toString() === req.user.id
    )

    if (!currentFriend || !requestingFriend) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    currentFriend.status = 'accepted'
    requestingFriend.status = 'accepted'

    await currentUser.save()
    await requestingUser.save()

    // Notify via Socket.io
    const io = getIO()
    io.to(userId).emit('friendRequestAccepted', {
      by: {
        id: req.user.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar
      }
    })

    res.json({ message: 'Friend request accepted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DECLINE or REMOVE friend
router.patch('/remove', auth, async (req, res) => {
  try {
    const { userId } = req.body

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friends: { user: userId } }
    })

    await User.findByIdAndUpdate(userId, {
      $pull: { friends: { user: req.user.id } }
    })

    res.json({ message: 'Friend removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// BLOCK a user
router.patch('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body

    const currentUser = await User.findById(req.user.id)

    if (!currentUser.blockedUsers.includes(userId)) {
      currentUser.blockedUsers.push(userId)
    }

    // Remove from friends if they were friends
    currentUser.friends = currentUser.friends.filter(
      f => f.user.toString() !== userId
    )

    await currentUser.save()

    // Remove current user from blocked user's friends too
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: { user: req.user.id } }
    })

    res.json({ message: 'User blocked' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends.user', 'username displayName avatar verified friendId')

    const accepted = user.friends.filter(f => f.status === 'accepted')
    const pending = user.friends.filter(f => f.status === 'pending')

    res.json({ accepted, pending })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET your own Friend ID
router.get('/my-id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('friendId')
    res.json({ friendId: user.friendId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router