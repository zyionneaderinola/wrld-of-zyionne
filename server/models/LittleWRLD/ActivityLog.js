const mongoose = require('mongoose')

const ActivityLogSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'login',
      'logout',
      'post_created',
      'post_rejected',
      'message_sent',
      'message_rejected',
      'contact_requested',
      'contact_approved',
      'game_played',
      'badge_earned',
      'screen_time_limit_reached',
      'flagged_content'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true })

module.exports = mongoose.model('ActivityLog', ActivityLogSchema)