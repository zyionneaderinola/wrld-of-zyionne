const express = require('express')
const router = express.Router()
const Story = require('../models/Story')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { upload } = require('../config/cloudinary')
const { extractMentions, notifyMentions } = require('../utils/mentions')
const Notification = require('../models/Notification')
const { getIO } = require('../socket')


// CREATE story
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const story = new Story({
      author: req.user.id,
      media: req.file ? {
        url: req.file.path,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      } : null,
      caption: req.body.caption || ''
    })

    await story.save()
    await story.populate('author', 'username displayName avatar verified')

    res.status(201).json(story)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET stories from people you follow
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const following = [...user.following, req.user.id]

    const stories = await Story.find({
      author: { $in: following },
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ createdAt: -1 })

    // Group by author
    const grouped = stories.reduce((acc, story) => {
      const authorId = story.author._id.toString()
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: []
        }
      }
      acc[authorId].stories.push(story)
      return acc
    }, {})

    res.json(Object.values(grouped))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// VIEW a story — adds viewer to viewers list
router.patch('/:id/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ error: 'Story not found' })

    const alreadyViewed = story.viewers.some(
      v => v.user.toString() === req.user.id
    )

    if (!alreadyViewed) {
      story.viewers.push({ user: req.user.id })
      await story.save()
    }

    res.json({ viewed: true, viewerCount: story.viewers.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET viewers of your story
router.get('/:id/viewers', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('viewers.user', 'username displayName avatar verified')

    if (!story) return res.status(404).json({ error: 'Story not found' })

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(story.viewers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ error: 'Story not found' })

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await story.deleteOne()
    res.json({ message: 'Story deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// REPLY TO A STORY
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ error: 'Story not found' })

    const { content } = req.body
    const mentionedUserIds = await extractMentions(content)

    // Story replies go to DMs automatically
    const Conversation = require('../models/Conversation')
    const Message = require('../models/Message')

    // Find or create conversation between replier and story author
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [req.user.id, story.author.toString()],
        $size: 2
      }
    })

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, story.author],
        isGroup: false
      })
      await conversation.save()
    }

    // Send reply as a message
    const message = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `Replied to your story: ${content}`,
    })

    await message.save()

    // Notify story author
    if (story.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: story.author,
        sender: req.user.id,
        type: 'comment',
        message: 'replied to your story'
      })
      await notification.save()

      const io = getIO()
      io.to(story.author.toString()).emit('notification', notification)
      io.to(story.author.toString()).emit('newMessage', {
        conversationId: conversation._id,
        message
      })
    }

    await notifyMentions(mentionedUserIds, req.user.id, null, 'mention')

    res.status(201).json({ message: 'Story reply sent as DM' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router