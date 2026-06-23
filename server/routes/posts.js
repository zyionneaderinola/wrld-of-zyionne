const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const Hashtag = require('../models/Hashtag')
const Notification = require('../models/Notification')
const auth = require('../middleware/auth')
const { upload } = require('../config/cloudinary')
const { getIO } = require('../socket')
const {
  extractMentions,
  extractHashtags,
  notifyMentions
} = require('../utils/mentions')

// CREATE POST
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { content, postType, publishAt } = req.body

    const media = req.files?.map(file => ({
      url: file.path,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image'
    })) || []

    const hashtags = extractHashtags(content)
    const mentionedUserIds = await extractMentions(content)
    const isScheduled = publishAt && new Date(publishAt) > new Date()

    const post = new Post({
      author: req.user.id,
      content,
      media,
      postType: postType || 'post',
      hashtags,
      mentions: mentionedUserIds,
      status: isScheduled ? 'scheduled' : 'published',
      publishAt: isScheduled ? new Date(publishAt) : null
    })

    await post.save()
    await post.populate('author', 'username displayName avatar verified')

    // Update hashtag counts
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { name: tag },
        {
          $inc: { postCount: 1, weeklyCount: 1 },
          $push: { posts: post._id },
          lastUsed: new Date()
        },
        { upsert: true, new: true }
      )
    }

    // Send mention notifications
    await notifyMentions(mentionedUserIds, req.user.id, post._id, 'mention')

    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET FEED
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const following = [...user.following, req.user.id]
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const posts = await Post.find({
      author: { $in: following },
      status: 'published',
      isArchived: false
    })
      .populate('author', 'username displayName avatar verified')
      .populate('comments.author', 'username displayName avatar')
      .populate('comments.replies.author', 'username displayName avatar')
      .populate('mentions', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET EXPLORE
router.get('/explore', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const posts = await Post.find({
      status: 'published',
      isArchived: false
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET SINGLE POST
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar verified')
      .populate('comments.author', 'username displayName avatar')
      .populate('comments.replies.author', 'username displayName avatar')
      .populate('mentions', 'username displayName avatar')

    if (!post) return res.status(404).json({ error: 'Post not found' })

    post.views += 1
    await post.save()

    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LIKE / UNLIKE POST
router.patch('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const alreadyLiked = post.likes.includes(req.user.id)

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user.id)
    } else {
      post.likes.push(req.user.id)

      // Notify post author
      if (post.author.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: post.author,
          sender: req.user.id,
          type: 'like',
          post: post._id,
          message: 'liked your post'
        })
        await notification.save()
        const io = getIO()
        io.to(post.author.toString()).emit('notification', notification)
      }
    }

    await post.save()
    res.json({ likes: post.likes.length, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADD COMMENT
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const mentionedUserIds = await extractMentions(req.body.content)

    const comment = {
      author: req.user.id,
      content: req.body.content,
      mentions: mentionedUserIds
    }

    post.comments.push(comment)
    await post.save()
    await post.populate('comments.author', 'username displayName avatar')

    const newComment = post.comments[post.comments.length - 1]

    // Notify post author
    if (post.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
        message: 'commented on your post'
      })
      await notification.save()
      const io = getIO()
      io.to(post.author.toString()).emit('notification', notification)
    }

    // Notify mentioned users
    await notifyMentions(mentionedUserIds, req.user.id, post._id, 'mention')

    res.status(201).json(newComment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// REPLY TO COMMENT
router.post('/:postId/comment/:commentId/reply', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    const mentionedUserIds = await extractMentions(req.body.content)

    const reply = {
      author: req.user.id,
      content: req.body.content,
      mentions: mentionedUserIds
    }

    comment.replies.push(reply)
    await post.save()
    await post.populate('comments.replies.author', 'username displayName avatar')

    const newReply = comment.replies[comment.replies.length - 1]

    // Notify comment author
    if (comment.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: comment.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
        message: 'replied to your comment'
      })
      await notification.save()
      const io = getIO()
      io.to(comment.author.toString()).emit('notification', notification)
    }

    // Notify mentioned users
    await notifyMentions(mentionedUserIds, req.user.id, post._id, 'mention')

    res.status(201).json(newReply)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LIKE A COMMENT
router.patch('/:postId/comment/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    const alreadyLiked = comment.likes.includes(req.user.id)

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        id => id.toString() !== req.user.id
      )
    } else {
      comment.likes.push(req.user.id)
    }

    await post.save()
    res.json({ likes: comment.likes.length, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LIKE A REPLY
router.patch('/:postId/comment/:commentId/reply/:replyId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    const reply = comment.replies.id(req.params.replyId)
    if (!reply) return res.status(404).json({ error: 'Reply not found' })

    const alreadyLiked = reply.likes.includes(req.user.id)

    if (alreadyLiked) {
      reply.likes = reply.likes.filter(
        id => id.toString() !== req.user.id
      )
    } else {
      reply.likes.push(req.user.id)
    }

    await post.save()
    res.json({ likes: reply.likes.length, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET SCHEDULED POSTS
router.get('/scheduled', auth, async (req, res) => {
  try {
    const posts = await Post.find({
      author: req.user.id,
      status: 'scheduled'
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ publishAt: 1 })

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UNSCHEDULE a post
router.patch('/:id/unschedule', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    post.status = 'draft'
    post.publishAt = null
    await post.save()

    res.json({ message: 'Post unscheduled and saved as draft' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUBLISH a draft
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    post.status = 'published'
    post.publishAt = null
    await post.save()

    res.json({ message: 'Post published', post })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE POST
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router