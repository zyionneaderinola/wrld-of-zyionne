const express = require('express')
const router = express.Router()
const CustomFont = require('../models/CustomFont')
const { WRLD_CHARACTER_SET } = require('../models/CustomFont')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

// GET the full character set for the font maker
router.get('/character-set', auth, async (req, res) => {
  try {
    res.json({
      characters: WRLD_CHARACTER_SET,
      previewSentence: 'The quick brown fox jumps over the lazy dog',
      previewNumbers: '0123456789',
      previewPunctuation: '.!?,:;-\'"()'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE a new custom font draft
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body

    const font = new CustomFont({
      creator: req.user.id,
      name,
      glyphs: []
    })

    await font.save()
    res.status(201).json(font)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SAVE/UPDATE a glyph
router.patch('/:id/glyph', auth, async (req, res) => {
  try {
    const { character, svgPath } = req.body
    const font = await CustomFont.findById(req.params.id)

    if (!font) return res.status(404).json({ error: 'Font not found' })
    if (font.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const existingIndex = font.glyphs.findIndex(
      g => g.character === character
    )

    if (existingIndex !== -1) {
      font.glyphs[existingIndex].svgPath = svgPath
    } else {
      font.glyphs.push({ character, svgPath })
    }

    await font.save()
    res.json(font)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET your own fonts
router.get('/me', auth, async (req, res) => {
  try {
    const fonts = await CustomFont.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
    res.json(fonts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET a single font
router.get('/:id', auth, async (req, res) => {
  try {
    const font = await CustomFont.findById(req.params.id)
      .populate('creator', 'username displayName avatar verified')

    if (!font) return res.status(404).json({ error: 'Font not found' })
    res.json(font)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUBLISH a font
router.patch('/:id/publish', auth, upload.single('fontFile'), async (req, res) => {
  try {
    const font = await CustomFont.findById(req.params.id)
    if (!font) return res.status(404).json({ error: 'Font not found' })

    if (font.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    font.status = 'published'
    font.isPublic = true
    if (req.file) font.fontFileUrl = req.file.path

    await font.save()
    res.json({ message: 'Font published to WRLD', font })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all public fonts
router.get('/', auth, async (req, res) => {
  try {
    const fonts = await CustomFont.find({ isPublic: true })
      .populate('creator', 'username displayName avatar verified')
      .sort({ downloads: -1, createdAt: -1 })
      .limit(50)
    res.json(fonts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LIKE a font
router.patch('/:id/like', auth, async (req, res) => {
  try {
    const font = await CustomFont.findById(req.params.id)
    if (!font) return res.status(404).json({ error: 'Font not found' })

    const alreadyLiked = font.likes.includes(req.user.id)

    if (alreadyLiked) {
      font.likes = font.likes.filter(id => id.toString() !== req.user.id)
    } else {
      font.likes.push(req.user.id)
    }

    await font.save()
    res.json({ likes: font.likes.length, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// APPLY a font to your profile
router.patch('/:id/apply', auth, async (req, res) => {
  try {
    const font = await CustomFont.findById(req.params.id)
    if (!font) return res.status(404).json({ error: 'Font not found' })

    if (!font.isPublic && font.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'This font is private' })
    }

    await User.findByIdAndUpdate(req.user.id, {
      'appearance.font': font.name,
      'appearance.customFontUrl': font.fontFileUrl
    })

    font.downloads += 1
    await font.save()

    res.json({ message: `Applied "${font.name}" to your WRLD` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE a font
router.delete('/:id', auth, async (req, res) => {
  try {
    const font = await CustomFont.findById(req.params.id)
    if (!font) return res.status(404).json({ error: 'Font not found' })

    if (font.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await font.deleteOne()
    res.json({ message: 'Font deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router