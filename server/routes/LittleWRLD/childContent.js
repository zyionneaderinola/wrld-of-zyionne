const express = require('express')
const router = express.Router()
const Child = require('../../models/LittleWRLD/Child')
const ChildPost = require('../../models/LittleWRLD/ChildPost')
const ChildMessage = require('../../models/LittleWRLD/ChildMessage')
const ActivityLog = require('../../models/LittleWRLD/ActivityLog')
const childAuth = require('../../middleware/childAuth')
const { upload } = require('../../config/cloudinary')
const { getIO } = require('../../socket')

// Blocked words for kids — stricter than main platform
const kidsBlockedWords = [
  'stupid', 'idiot', 'hate', 'kill', 'die',
  'ugly', 'fat', 'loser', 'dumb', 'shut up'
]

const filterKidsContent = (text) => {
  if (!text) return { clean: true }
  const lower = text.toLowerCase()
  const flagged = kidsBlockedWords.filter(word => lower.includes(word))
  return { clean: flagged.length === 0, flagged }
}

// CREATE a post
router.post('/posts', childAuth, upload.single('media'), async (req, res) => {
  try {
    const child = await Child.findById(req.child.id)
    if (!child) return res.status(404).json({ error: 'Account not found' })

    if (!child.parentalControls.canPostContent) {
      return res.status(403).json({
        error: 'Posting has been turned off by your parent'
      })
    }

    const { content, postType } = req.body

    // Filter content
    const filter = filterKidsContent(content)
    if (!filter.clean) {
      await ActivityLog.create({
        child: child._id,
        parent: child.parentAccount,
        activityType: 'post_rejected',
        description: 'Post rejected due to inappropriate content',
        metadata: { flagged: filter.flagged }
      })

      return res.status(400).json({
        error: 'Your post contains words that are not allowed. Try again!'
      })
    }

    const post = new ChildPost({
      author: req.child.id,
      content,
      postType: postType || 'thought',
      media: req.file ? [{
        url: req.file.path,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      }] : [],
      moderationStatus: 'approved',
      isVisible: true
    })

    await post.save()

    // Award points for posting
    child.points += 10
    await child.save()

    // Log activity
    await ActivityLog.create({
      child: child._id,
      parent: child.parentAccount,
      activityType: 'post_created',
      description: `${child.displayName} created a new post`
    })

    // Notify parent via Socket.io
    const io = getIO()
    io.to(child.parentAccount.toString()).emit('childActivity', {
      type: 'post_created',
      child: { id: child._id, displayName: child.displayName },
      post
    })

    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET feed — safe curated content only
router.get('/feed', childAuth, async (req, res) => {
  try {
    const child = await Child.findById(req.child.id)

    const posts = await ChildPost.find({
      isVisible: true,
      moderationStatus: 'approved'
    })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SEND a message — only to approved contacts
router.post('/messages', childAuth, async (req, res) => {
  try {
    const child = await Child.findById(req.child.id)
    if (!child) return res.status(404).json({ error: 'Account not found' })

    if (!child.parentalControls.canSendMessages) {
      return res.status(403).json({
        error: 'Messaging has been turned off by your parent'
      })
    }

    const { recipientId, content } = req.body

    // Check if recipient is an approved contact
    const isApproved = child.approvedContacts.includes(recipientId)
    if (!isApproved) {
      return res.status(403).json({
        error: 'You can only message approved friends'
      })
    }

    // Filter content
    const filter = filterKidsContent(content)
    if (!filter.clean) {
      await ActivityLog.create({
        child: child._id,
        parent: child.parentAccount,
        activityType: 'message_rejected',
        description: 'Message rejected due to inappropriate content',
        metadata: { flagged: filter.flagged }
      })

      return res.status(400).json({
        error: 'Your message contains words that are not allowed. Try again!'
      })
    }

    const message = new ChildMessage({
      sender: req.child.id,
      recipient: recipientId,
      content,
      moderationStatus: 'approved'
    })

    await message.save()

    // Notify recipient and their parent via Socket.io
    const recipient = await Child.findById(recipientId)
    const io = getIO()

    io.to(recipientId.toString()).emit('newChildMessage', message)
    io.to(recipient.parentAccount.toString()).emit('childActivity', {
      type: 'message_sent',
      child: { id: child._id, displayName: child.displayName },
      message
    })

    // Log activity
    await ActivityLog.create({
      child: child._id,
      parent: child.parentAccount,
      activityType: 'message_sent',
      description: `${child.displayName} sent a message`
    })

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SEND contact request — goes to parent for approval
router.post('/contacts/request/:targetId', childAuth, async (req, res) => {
  try {
    const child = await Child.findById(req.child.id)
    const target = await Child.findById(req.params.targetId)

    if (!target) return res.status(404).json({ error: 'User not found' })

    const alreadyPending = target.pendingContacts.some(
      p => p.from.toString() === req.child.id
    )

    if (alreadyPending) {
      return res.status(400).json({ error: 'Request already sent' })
    }

    if (target.parentalControls.requiresApprovalForContacts) {
      target.pendingContacts.push({ from: req.child.id })
      await target.save()

      // Notify target's parent
      const io = getIO()
      io.to(target.parentAccount.toString()).emit('contactRequest', {
        from: {
          id: child._id,
          displayName: child.displayName,
          username: child.username
        },
        for: {
          id: target._id,
          displayName: target.displayName
        }
      })

      res.json({
        message: 'Friend request sent! Waiting for parent approval.'
      })
    } else {
      target.approvedContacts.push(req.child.id)
      child.approvedContacts.push(req.params.targetId)
      await target.save()
      await child.save()

      res.json({ message: 'Friend added!' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET child's approved contacts
router.get('/contacts', childAuth, async (req, res) => {
  try {
    const child = await Child.findById(req.child.id)
      .populate('approvedContacts', 'username displayName avatar points badges')

    res.json(child.approvedContacts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// EARN a badge
router.post('/badges', childAuth, async (req, res) => {
  try {
    const { name, description, icon } = req.body
    const child = await Child.findById(req.child.id)

    const alreadyEarned = child.badges.some(b => b.name === name)
    if (alreadyEarned) {
      return res.status(400).json({ error: 'Badge already earned' })
    }

    child.badges.push({ name, description, icon })
    child.points += 50
    await child.save()

    // Log and notify parent
    await ActivityLog.create({
      child: child._id,
      parent: child.parentAccount,
      activityType: 'badge_earned',
      description: `${child.displayName} earned the "${name}" badge!`
    })

    const io = getIO()
    io.to(child.parentAccount.toString()).emit('childActivity', {
      type: 'badge_earned',
      child: { id: child._id, displayName: child.displayName },
      badge: { name, description, icon }
    })

    res.json({ message: `Badge earned: ${name}!`, points: child.points })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router