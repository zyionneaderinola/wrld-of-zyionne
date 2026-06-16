const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const auth = require('../middleware/auth')
const { upload } = require('../config/cloudinary')
const { getIO } = require('../socket')

// CREATE or GET existing conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body

    // Guard — only friends can DM each other (for non-group DMs)
if (!isGroup) {
  const currentUser = await User.findById(req.user.id)
  const areFriends = currentUser.friends.some(
    f => f.user.toString() === participantId &&
    f.status === 'accepted'
  )

  if (!areFriends) {
    return res.status(403).json({
      error: 'You can only DM your friends. Send a friend request first.'
    })
  }
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [req.user.id, participantId],
        $size: 2
      }
    })

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, participantId],
        isGroup: false
      })
      await conversation.save()
    }

    await conversation.populate('participants', 'username displayName avatar verified')
    res.json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'username displayName avatar verified')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })

    res.json(conversations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET messages in a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = 30
    const skip = (page - 1) * limit

    const messages = await Message.find({
      conversation: req.params.id,
      deletedFor: { $nin: [req.user.id] },
      isDeleted: false
    })
      .populate('sender', 'username displayName avatar verified')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json(messages.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SEND a message
router.post('/conversations/:id/messages', auth, upload.single('media'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const message = new Message({
      conversation: req.params.id,
      sender: req.user.id,
      content: req.body.content || '',
      media: req.file ? {
        url: req.file.path,
        type: req.file.mimetype.startsWith('video/')
          ? 'video'
          : req.file.mimetype.startsWith('audio/')
            ? 'audio'
            : 'image'
      } : null,
      replyTo: req.body.replyTo || null
    })

    await message.save()
    await message.populate('sender', 'username displayName avatar verified')
    await message.populate('replyTo')

    // Update conversation last message
    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()
    await conversation.save()

    // Emit real time message via Socket.io
    const io = getIO()
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('newMessage', {
          conversationId: req.params.id,
          message
        })
      }
    })

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// MARK messages as read
router.patch('/conversations/:id/read', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.id,
        'readBy.user': { $nin: [req.user.id] },
        sender: { $ne: req.user.id }
      },
      {
        $push: {
          readBy: { user: req.user.id, readAt: new Date() }
        }
      }
    )

    // Emit read receipt via Socket.io
    const io = getIO()
    io.to(req.params.id).emit('messagesRead', {
      conversationId: req.params.id,
      userId: req.user.id
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE message for yourself
router.patch('/messages/:id/delete', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ error: 'Message not found' })

    message.deletedFor.push(req.user.id)
    await message.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE message for everyone (only sender can do this)
router.patch('/messages/:id/delete-all', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ error: 'Message not found' })

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    message.isDeleted = true
    message.content = 'This message was deleted'
    await message.save()

    // Notify all participants via Socket.io
    const io = getIO()
    const conversation = await Conversation.findById(message.conversation)
    conversation.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('messageDeleted', {
        messageId: message._id,
        conversationId: message.conversation
      })
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// TYPING indicator
router.post('/conversations/:id/typing', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const io = getIO()
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('typing', {
          conversationId: req.params.id,
          userId: req.user.id,
          isTyping: req.body.isTyping
        })
      }
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router