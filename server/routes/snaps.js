const express = require('express')
const router = express.Router()
const Snap = require('../models/Snap')
const auth = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

// SEND a snap
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const { recipientId, caption } = req.body

    const snap = new Snap({
      sender: req.user.id,
      recipient: recipientId,
      media: req.file ? {
        url: req.file.path,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      } : undefined,
      caption: caption || ''
    })

    await snap.save()
    await snap.populate('sender', 'username displayName avatar verified')

    res.status(201).json(snap)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all snaps sent to you
router.get('/inbox', auth, async (req, res) => {
  try {
    const snaps = await Snap.find({
      recipient: req.user.id,
      opened: false
    })
      .populate('sender', 'username displayName avatar verified')
      .sort({ createdAt: -1 })

    res.json(snaps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// OPEN a snap — marks as opened and sets expiry
router.patch('/:id/open', auth, async (req, res) => {
  try {
    const snap = await Snap.findById(req.params.id)
    if (!snap) return res.status(404).json({ error: 'Snap not found' })

    if (snap.recipient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (snap.opened) {
      return res.status(400).json({ error: 'Snap already opened' })
    }

    // Set expiry to 10 seconds after opening
    snap.opened = true
    snap.openedAt = new Date()
    snap.expiresAt = new Date(Date.now() + 10 * 1000)

    await snap.save()

    res.json({
      snap,
      message: 'Snap opened — disappears in 10 seconds'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET sent snaps
router.get('/sent', auth, async (req, res) => {
  try {
    const snaps = await Snap.find({ sender: req.user.id })
      .populate('recipient', 'username displayName avatar verified')
      .sort({ createdAt: -1 })

    res.json(snaps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router