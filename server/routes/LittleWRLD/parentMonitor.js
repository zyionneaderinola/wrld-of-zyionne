const express = require('express')
const router = express.Router()
const Child = require('../../models/LittleWRLD/Child')
const ChildPost = require('../../models/LittleWRLD/ChildPost')
const ChildMessage = require('../../models/LittleWRLD/ChildMessage')
const ActivityLog = require('../../models/LittleWRLD/ActivityLog')
const auth = require('../../middleware/auth')

// GET all children linked to parent account
router.get('/children', auth, async (req, res) => {
  try {
    const children = await Child.find({ parentAccount: req.user.id })
      .select('-password')

    res.json(children)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET activity log for a child
router.get('/children/:id/activity', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const logs = await ActivityLog.find({ child: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET child's messages
router.get('/children/:id/messages', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const messages = await ChildMessage.find({
      $or: [
        { sender: req.params.id },
        { recipient: req.params.id }
      ]
    })
      .populate('sender', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar')
      .sort({ createdAt: -1 })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET child's posts
router.get('/children/:id/posts', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const posts = await ChildPost.find({ author: req.params.id })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE parental controls
router.patch('/children/:id/controls', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const {
      canSendMessages,
      canPostContent,
      canComment,
      canPlayGames,
      requiresApprovalForContacts,
      contentFilterLevel,
      dailyLimitMinutes,
      sessionStartTime,
      sessionEndTime
    } = req.body

    child.parentalControls = {
      canSendMessages: canSendMessages ?? child.parentalControls.canSendMessages,
      canPostContent: canPostContent ?? child.parentalControls.canPostContent,
      canComment: canComment ?? child.parentalControls.canComment,
      canPlayGames: canPlayGames ?? child.parentalControls.canPlayGames,
      requiresApprovalForContacts: requiresApprovalForContacts ?? child.parentalControls.requiresApprovalForContacts,
      contentFilterLevel: contentFilterLevel || child.parentalControls.contentFilterLevel
    }

    if (dailyLimitMinutes) child.screenTime.dailyLimitMinutes = dailyLimitMinutes
    if (sessionStartTime) child.screenTime.sessionStartTime = sessionStartTime
    if (sessionEndTime) child.screenTime.sessionEndTime = sessionEndTime

    await child.save()

    res.json({
      message: 'Parental controls updated',
      parentalControls: child.parentalControls,
      screenTime: child.screenTime
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// APPROVE a contact request
router.patch('/children/:childId/contacts/:contactId/approve', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Move from pending to approved
    child.pendingContacts = child.pendingContacts.filter(
      p => p.from.toString() !== req.params.contactId
    )
    child.approvedContacts.push(req.params.contactId)

    await child.save()

    res.json({ message: 'Contact approved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DECLINE a contact request
router.patch('/children/:childId/contacts/:contactId/decline', auth, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId)
    if (!child) return res.status(404).json({ error: 'Child not found' })

    if (child.parentAccount.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    child.pendingContacts = child.pendingContacts.filter(
      p => p.from.toString() !== req.params.contactId
    )

    await child.save()
    res.json({ message: 'Contact request declined' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router