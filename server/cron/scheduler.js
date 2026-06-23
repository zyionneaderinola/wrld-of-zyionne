const cron = require('node-cron')
const Post = require('../models/Post')
const Article = require('../models/Article')
const Child = require('../models/LittleWRLD/Child')
const { getIO } = require('../socket')

const startScheduler = () => {

  // Every minute — publish scheduled posts and articles
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()

      const postsToPublish = await Post.find({
        status: 'scheduled',
        publishAt: { $lte: now }
      })

      if (postsToPublish.length > 0) {
        const postIds = postsToPublish.map(p => p._id)
        await Post.updateMany(
          { _id: { $in: postIds } },
          { status: 'published', publishAt: null }
        )
        console.log(`✅ Published ${postsToPublish.length} scheduled post(s)`)
      }

      const articlesToPublish = await Article.find({
        status: 'scheduled',
        publishAt: { $lte: now }
      })

      if (articlesToPublish.length > 0) {
        const articleIds = articlesToPublish.map(a => a._id)
        await Article.updateMany(
          { _id: { $in: articleIds } },
          { status: 'published', publishAt: null }
        )
        console.log(`✅ Published ${articlesToPublish.length} scheduled article(s)`)
      }

    } catch (err) {
      console.error('Scheduler error:', err.message)
    }
  })

  // Daily at midnight — check for graduation eligible children
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date()
      const children = await Child.find({ hasGraduated: false })

      for (const child of children) {
        const birth = new Date(child.dateOfBirth)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }

        if (age >= 21) {
          // Notify parent that child is ready to graduate
          const io = getIO()
          io.to(child.parentAccount.toString()).emit('graduationReady', {
            child: {
              id: child._id,
              displayName: child.displayName,
              age
            },
            message: `${child.displayName} is now 21 and ready to graduate to main WRLD!`
          })

          console.log(`🎓 ${child.displayName} is eligible for graduation`)
        }
      }
    } catch (err) {
      console.error('Graduation check error:', err.message)
    }
  })

  // Reset daily screen time at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await Child.updateMany(
        {},
        {
          'screenTime.todayUsageMinutes': 0,
          'screenTime.lastUsageReset': new Date()
        }
      )
      console.log('⏱️ Screen time reset for all Little WRLD accounts')
    } catch (err) {
      console.error('Screen time reset error:', err.message)
    }
  })

  console.log('📅 WRLD Scheduler is running')
}

module.exports = { startScheduler }