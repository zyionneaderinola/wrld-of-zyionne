const { WRLD_CHARACTER_SET } = require('../models/CustomFont')

// GET the full character set for the font maker
router.get('/character-set', auth, async (req, res) => {
  res.json({
    characters: WRLD_CHARACTER_SET,
    previewSentence: 'The quick brown fox jumps over the lazy dog',
    previewNumbers: '0123456789',
    previewPunctuation: '.!?,:;-\'"()'
  })
})