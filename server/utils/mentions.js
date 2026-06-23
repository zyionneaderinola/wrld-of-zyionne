const User = require('../models/User')
const Notification = require('../models/Notification')
const { getIO } = require('../socket')

// Extract @mentions from content
const extractMentions = async (content) => {
  if (!content) return []

  const mentionRegex = /@(\w+)/g
  const matches = [...content.matchAll(mentionRegex)]
  const usernames = matches.map(m => m[1])

  if (usernames.length === 0) return []

  const users = await User.find({
    username: { $in: usernames }
  }).select('_id username')

  return users.map(u => u._id)
}

// Extract #hashtags from content
const extractHashtags = (content) => {
  if (!content) return []
  const hashtagRegex = /#(\w+)/g
  const matches = [...content.matchAll(hashtagRegex)]
  return matches.map(m => m[1].toLowerCase())
}

// Send mention notifications
const notifyMentions = async (mentionedUserIds, senderId, postId, type) => {
  if (!mentionedUserIds || mentionedUserIds.length === 0) return

  const io = getIO()

  for (const recipientId of mentionedUserIds) {
    if (recipientId.toString() === senderId.toString()) continue

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type: 'mention',
      post: postId,
      message: 'mentioned you'
    })

    await notification.save()
    await notification.populate('sender', 'username displayName avatar verified')

    io.to(recipientId.toString()).emit('notification', notification)
  }
}

module.exports = { extractMentions, extractHashtags, notifyMentions }