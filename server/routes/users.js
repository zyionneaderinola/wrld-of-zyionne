const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// GET user profile
router.get('/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username displayName avatar verified')
      .populate('following', 'username displayName avatar verified');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const posts = await Post.find({
      author: user._id,
      isArchived: false
    })
      .populate('author', 'username displayName avatar verified')
      .sort({ createdAt: -1 });

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FOLLOW / UNFOLLOW
router.patch('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' })
    }

    const userToFollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.user.id)

    if (!userToFollow) return res.status(404).json({ error: 'User not found' })

    const isFollowing = currentUser.following.includes(req.params.id)

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      )
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.user.id
      )
    } else {
      // Follow
      currentUser.following.push(req.params.id)
      userToFollow.followers.push(req.user.id)
    }

    await currentUser.save()
    await userToFollow.save()

    res.json({
      following: !isFollowing,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

// SEARCH users
router.get('/search/users', auth, async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json([])

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username displayName avatar verified followers')
      .limit(10)

    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

// UPDATE profile
router.patch('/profile/update', auth, async (req, res) => {
  try {
    const { displayName, bio, isPrivate } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, bio, isPrivate },
      { new: true }
    ).select('-password')

    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

// UPDATE purpose — user changes their aim anytime
router.patch('/profile/purpose', auth, async (req, res) => {
  try {
    const { purpose, worlds, interests } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(purpose && { purpose }),
        ...(worlds && { worlds }),
        ...(interests && { interests })
      },
      { new: true }
    ).select('-password')

    res.json({
      message: 'Your WRLD has been updated',
      purpose: user.purpose,
      worlds: user.worlds,
      interests: user.interests
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;