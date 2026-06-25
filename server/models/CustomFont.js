const mongoose = require('mongoose')

const WRLD_CHARACTER_SET = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  '0','1','2','3','4','5','6','7','8','9',
  '.','!','?',',',':',';','-','\'','"','(',')'
]

const GlyphSchema = new mongoose.Schema({
  character: { type: String, required: true },
  svgPath: { type: String, required: true }
}, { _id: false })

const CustomFontSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  glyphs: [GlyphSchema],
  fontFileUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'compiled', 'published'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true })

const CustomFont = mongoose.model('CustomFont', CustomFontSchema)

module.exports = CustomFont
module.exports.WRLD_CHARACTER_SET = WRLD_CHARACTER_SET