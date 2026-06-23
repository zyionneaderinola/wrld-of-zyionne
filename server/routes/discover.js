const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const Hashtag = require('../models/Hashtag')
const Forum = require('../models/Forum')
const Community = require('../models/Community')
const auth = require('../middleware/auth')
const Article = require('../models/Article')

// SEARCH everything
router.get('/search', auth, async (req, res) => {
  try {
    const { q, type } = req.query
    if (!q) return res.json({ users: [], posts: [], hashtags: [], forums: [], communities: [] })

    const regex = { $regex: q, $options: 'i' }

    if (type === 'users') {
      const users = await User.find({
        $or: [{ username: regex }, { displayName: regex }]
      }).select('username displayName avatar verified followers').limit(20)
      return res.json({ users })
    }

    if (type === 'posts') {
      const posts = await Post.find({
        $or: [{ content: regex }, { hashtags: regex }],
        isArchived: false
      })
        .populate('author', 'username displayName avatar verified')
        .sort({ createdAt: -1 })
        .limit(20)
      return res.json({ posts })
    }

    if (type === 'hashtags') {
      const hashtags = await Hashtag.find({ name: regex })
        .sort({ postCount: -1 })
        .limit(20)
      return res.json({ hashtags })
    }

    if (type === 'forums') {
      const forums = await Forum.find({
        $or: [{ name: regex }, { description: regex }]
      })
        .populate('creator', 'username displayName avatar')
        .limit(20)
      return res.json({ forums })
    }

    if (type === 'communities') {
      const communities = await Community.find({
        $or: [{ name: regex }, { description: regex }],
        isPublic: true
      }).limit(20)
      return res.json({ communities })
    }

    // Search everything at once
    const [users, posts, hashtags, forums, communities] = await Promise.all([
      User.find({
        $or: [{ username: regex }, { displayName: regex }]
      }).select('username displayName avatar verified followers').limit(5),

      Post.find({
        $or: [{ content: regex }, { hashtags: regex }],
        isArchived: false
      })
        .populate('author', 'username displayName avatar verified')
        .sort({ createdAt: -1 })
        .limit(5),

      Hashtag.find({ name: regex })
        .sort({ postCount: -1 })
        .limit(5),

      Forum.find({
        $or: [{ name: regex }, { description: regex }]
      })
        .populate('creator', 'username displayName avatar')
        .limit(5),

      Community.find({
        $or: [{ name: regex }, { description: regex }],
        isPublic: true
      }).limit(5)
    ])

    res.json({ users, posts, hashtags, forums, communities })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// TRENDING hashtags
router.get('/trending', auth, async (req, res) => {
  try {
    const hashtags = await Hashtag.find()
      .sort({ weeklyCount: -1 })
      .limit(20)

    res.json(hashtags)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SUGGESTED users to follow
router.get('/suggested', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)

    const suggested = await User.find({
      _id: {
        $nin: [...currentUser.following, req.user.id]
      }
    })
      .select('username displayName avatar verified followers')
      .sort({ followers: -1 })
      .limit(10)

    res.json(suggested)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// EXPLORE — trending posts
router.get('/explore', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const posts = await Post.find({ isArchived: false })
      .populate('author', 'username displayName avatar verified')
      .sort({ 'likes': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET posts by hashtag
router.get('/hashtag/:name', auth, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({
      name: req.params.name.toLowerCase()
    })

    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' })
    }

    const posts = await Post.find({
      hashtags: req.params.name.toLowerCase(),
      isArchived: false
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ hashtag, posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SUGGESTED articles
router.get('/suggested/articles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    const articles = await Article.find({
      status: 'published',
      author: { $nin: [req.user.id] }
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ views: -1, likes: -1 })
      .limit(10)

    res.json(articles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SUGGESTED communities
router.get('/suggested/communities', auth, async (req, res) => {
  try {
    const Community = require('../models/Community')

    const communities = await Community.find({ isPublic: true })
      .sort({ memberCount: -1 })
      .limit(10)

    res.json(communities)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SUGGESTED forums
router.get('/suggested/forums', auth, async (req, res) => {
  try {
    const Forum = require('../models/Forum')

    const forums = await Forum.find({ isPrivate: false })
      .populate('creator', 'username displayName avatar verified')
      .sort({ postCount: -1, 'members': -1 })
      .limit(10)

    res.json(forums)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SUGGESTED users — based on shared worlds, interests, and purpose
router.get('/suggested', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)

    const suggested = await User.find({
      _id: { $nin: [...currentUser.following, req.user.id] },
      $or: [
        { worlds: { $in: currentUser.worlds } },
        { interests: { $in: currentUser.interests } },
        { purpose: { $in: currentUser.purpose } }
      ]
    })
      .select('username displayName avatar verified followers worlds purpose')
      .limit(10)

    res.json(suggested)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router