const mongoose = require('mongoose')

const SnapSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    url: { type: String },
    type: { type: String, enum: ['image', 'video'] }
  },
  caption: {
    type: String,
    default: ''
  },
  opened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// Auto delete after opened and expiry
SnapSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Snap', SnapSchema)