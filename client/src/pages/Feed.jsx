import { useState, useEffect } from 'react'
import axios from 'axios'
import CreatePost from '../components/CreatePost'


const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${API}/api/posts/feed`)
      setPosts(res.data)
    } catch (err) {
      setError('Could not load feed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: 'var(--color-text-muted)' }}>Loading your feed...</p>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: '#ff5050' }}>{error}</p>
    </div>
  )

 return (
  <div className="max-w-xl mx-auto px-4 py-6">

    {/* Feed header */}
    <div className="mb-6">
      <h1 className="text-xl font-bold"
        style={{ color: 'var(--color-text)' }}>
        Your Feed
      </h1>
    </div>

    {/* Create post */}
    <CreatePost onSuccess={fetchFeed} />

    {/* Posts or empty state */}
    {posts.length === 0 ? (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🌍</p>
        <p className="font-semibold mb-2"
          style={{ color: 'var(--color-text)' }}>
          Your feed is empty
        </p>
        <p className="text-sm"
          style={{ color: 'var(--color-text-muted)' }}>
          Follow people to see their posts here
        </p>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <PostCard key={post._id} post={post} onUpdate={fetchFeed} />
        ))}
      </div>
    )}

  </div>
)
}

function PostCard({ post, onUpdate }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLike = async () => {
    try {
      const res = await axios.patch(`${API}/api/posts/${post._id}/like`)
      setLiked(res.data.liked)
      setLikeCount(res.data.likes)
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await axios.post(`${API}/api/posts/${post._id}/comment`, {
        content: comment
      })
      setComment('')
      onUpdate()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)'
      }}>

      {/* Post header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            backgroundColor: 'rgba(255,215,0,0.15)',
            color: 'var(--color-primary)',
            border: '1px solid rgba(255,215,0,0.3)'
          }}>
          {post.author?.displayName?.[0] || post.author?.username?.[0] || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold"
            style={{ color: 'var(--color-text)' }}>
            {post.author?.displayName || post.author?.username}
          </p>
          <p className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}>
            @{post.author?.username} · {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Post type badge */}
        <div className="ml-auto">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: 'rgba(255,215,0,0.08)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(255,215,0,0.2)'
            }}>
            {post.postType || 'post'}
          </span>
        </div>
      </div>

      {/* Post content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text)' }}>
            {post.content}
          </p>
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {post.hashtags.map(tag => (
            <span key={tag}
              className="text-xs font-medium"
              style={{ color: 'var(--color-primary)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="w-full">
          {post.media[0].type === 'image' ? (
            <img
              src={post.media[0].url}
              alt="post media"
              className="w-full object-cover max-h-96"
            />
          ) : (
            <video
              src={post.media[0].url}
              controls
              className="w-full max-h-96"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3"
        style={{ borderTop: '1px solid var(--color-border)' }}>

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition-all"
          style={{
            color: liked ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}>
          <span>{liked ? '♥' : '♡'}</span>
          <span>{likeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm transition-all"
          style={{
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}>
          <span>💬</span>
          <span>{post.comments?.length || 0}</span>
        </button>

        {/* Views */}
        <span className="flex items-center gap-1.5 text-sm ml-auto"
          style={{ color: 'var(--color-text-faint)' }}>
          <span>👁</span>
          <span>{post.views || 0}</span>
        </span>

      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4"
          style={{ borderTop: '1px solid var(--color-border)' }}>

          {/* Existing comments */}
          {post.comments?.length > 0 && (
            <div className="flex flex-col gap-3 pt-3 mb-3">
              {post.comments.map(c => (
                <div key={c._id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(255,215,0,0.1)',
                      color: 'var(--color-primary)'
                    }}>
                    {c.author?.displayName?.[0] || c.author?.username?.[0] || '?'}
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2"
                    style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                    <p className="text-xs font-semibold mb-0.5"
                      style={{ color: 'var(--color-text)' }}>
                      {c.author?.displayName || c.author?.username}
                    </p>
                    <p className="text-sm"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <form onSubmit={handleComment} className="flex gap-2 pt-3">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: comment.trim()
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-surface)',
                color: comment.trim() ? '#0D0D0D' : 'var(--color-text-faint)',
                border: 'none',
                cursor: comment.trim() ? 'pointer' : 'not-allowed'
              }}>
              Post
            </button>
          </form>

        </div>
      )}

    </div>
  )
}