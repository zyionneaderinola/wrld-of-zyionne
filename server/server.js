require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { initSocket } = require('./socket')
const { startScheduler } = require('./cron/scheduler')

const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const userRoutes = require('./routes/users')
const notificationRoutes = require('./routes/notifications')
const storyRoutes = require('./routes/stories')
const snapRoutes = require('./routes/snaps')
const messageRoutes = require('./routes/messages')
const friendRoutes = require('./routes/friends')
const discoverRoutes = require('./routes/discover')
const forumRoutes = require('./routes/forums')
const communityRoutes = require('./routes/communities')
const moderationRoutes = require('./routes/moderation')
const archiveRoutes = require('./routes/archive')
const articleRoutes = require('./routes/articles')
const locketRoutes = require('./routes/lockets')
const fontRoutes = require('./routes/fonts')

// Little WRLD
const childAuthRoutes = require('./routes/littleWRLD/childAuth')
const childContentRoutes = require('./routes/littleWRLD/childContent')
const parentMonitorRoutes = require('./routes/littleWRLD/parentMonitor')
const graduationRoutes = require('./routes/littleWRLD/graduation')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

initSocket(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    startScheduler()
  })
  .catch((err) => console.error('Error connecting to MongoDB:', err))

app.get('/', (req, res) => {
  res.send('WRLD server is running!')
})

// Main WRLD routes
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/stories', storyRoutes)
app.use('/api/snaps', snapRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/discover', discoverRoutes)
app.use('/api/forums', forumRoutes)
app.use('/api/communities', communityRoutes)
app.use('/api/moderation', moderationRoutes)
app.use('/api/archive', archiveRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/lockets', locketRoutes)
app.use('/api/fonts', fontRoutes)

// Little WRLD routes
app.use('/api/little/auth', childAuthRoutes)
app.use('/api/little/content', childContentRoutes)
app.use('/api/little/parent', parentMonitorRoutes)
app.use('/api/little/graduation', graduationRoutes)

server.listen(port, () => {
  console.log(`WRLD server is running on port ${port}`)
})