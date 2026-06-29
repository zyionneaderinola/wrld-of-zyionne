import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function CreatePost({ onSuccess }) {
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('post')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API}/api/posts`, { content, postType })
      setContent('')
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const types = [
    { id: 'post', label: 'Post', emoji: '📷' },
    { id: 'tweet', label: 'Thought', emoji: '💭' },
    { id: 'reel', label: 'Reel', emoji: '▶️' },
  ]

  return (
    <div className="rounded-2xl p-4 mb-6"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)'
      }}>

      {/* Post type selector */}
      <div className="flex gap-2 mb-3">
        {types.map(type => (
          <button
            key={type.id}
            onClick={() => setPostType(type.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: postType === type.id
                ? 'rgba(255,215,0,0.15)'
                : 'var(--color-bg-surface)',
              color: postType === type.id
                ? 'var(--color-primary)'
                : 'var(--color-text-muted)',
              border: postType === type.id
                ? '1px solid rgba(255,215,0,0.4)'
                : '1px solid var(--color-border)',
              cursor: 'pointer'
            }}>
            <span>{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Text area */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            postType === 'tweet'
              ? "What's on your mind?"
              : postType === 'reel'
              ? 'Describe your reel...'
              : 'Share something with your world...'
          }
          rows={3}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-primary)'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />

        {error && (
          <p className="text-xs mt-1" style={{ color: '#ff5050' }}>{error}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs"
            style={{
              color: content.length > 400
                ? '#ff5050'
                : 'var(--color-text-faint)'
            }}>
            {content.length} characters
          </span>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all"
            style={{
              backgroundColor: content.trim()
                ? 'var(--color-primary)'
                : 'var(--color-bg-surface)',
              color: content.trim() ? '#0D0D0D' : 'var(--color-text-faint)',
              border: 'none',
              cursor: content.trim() ? 'pointer' : 'not-allowed'
            }}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}