import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Explore() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] })
  const [trending, setTrending] = useState([])
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('trending')

  useEffect(() => {
    fetchTrending()
    fetchSuggested()
  }, [])

  useEffect(() => {
    if (query.trim().length > 1) {
      const delay = setTimeout(() => search(), 400)
      return () => clearTimeout(delay)
    } else {
      setResults({ users: [], posts: [], hashtags: [] })
    }
  }, [query])

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`${API}/api/discover/trending`)
      setTrending(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSuggested = async () => {
    try {
      const res = await axios.get(`${API}/api/discover/suggested`)
      setSuggested(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const search = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/discover/search?q=${query}`)
      setResults(res.data)
      setActiveTab('results')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId) => {
    try {
      await axios.patch(`${API}/api/users/${userId}/follow`)
      fetchSuggested()
    } catch (err) {
      console.error(err)
    }
  }

  const tabs = ['trending', 'suggested', 'results']

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-4"
          style={{ color: 'var(--color-text)' }}>
          Explore
        </h1>

        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}>
            🔍
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, posts, hashtags..."
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-primary)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--color-text-muted)' }}>
              searching...
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.filter(t => t !== 'results' || query.trim()).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              backgroundColor: activeTab === tab
                ? 'var(--color-primary)'
                : 'var(--color-bg-card)',
              color: activeTab === tab
                ? '#0D0D0D'
                : 'var(--color-text-muted)',
              border: activeTab === tab
                ? 'none'
                : '1px solid var(--color-border)',
              cursor: 'pointer'
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Trending hashtags */}
      {activeTab === 'trending' && (
        <div className="flex flex-col gap-2">
          {trending.length === 0 ? (
            <p className="text-sm text-center py-10"
              style={{ color: 'var(--color-text-muted)' }}>
              No trending topics yet
            </p>
          ) : (
            trending.map(tag => (
              <div key={tag._id}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)'
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'}
                onMouseLeave={e =>
                  e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <div>
                  <p className="text-sm font-semibold"
                    style={{ color: 'var(--color-primary)' }}>
                    #{tag.name}
                  </p>
                  <p className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {tag.postCount} posts
                  </p>
                </div>
                <span style={{ color: 'var(--color-text-faint)' }}>→</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suggested users */}
      {activeTab === 'suggested' && (
        <div className="flex flex-col gap-3">
          {suggested.length === 0 ? (
            <p className="text-sm text-center py-10"
              style={{ color: 'var(--color-text-muted)' }}>
              No suggestions yet
            </p>
          ) : (
            suggested.map(user => (
              <div key={user._id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)'
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(255,215,0,0.15)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(255,215,0,0.3)'
                  }}>
                  {user.displayName?.[0] || user.username?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate"
                    style={{ color: 'var(--color-text)' }}>
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}>
                    @{user.username} · {user.followers?.length || 0} followers
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(user._id)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#0D0D0D',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                  Follow
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search results */}
      {activeTab === 'results' && (
        <div className="flex flex-col gap-6">

          {/* Users */}
          {results.users?.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--color-text-muted)' }}>
                People
              </p>
              <div className="flex flex-col gap-2">
                {results.users.map(user => (
                  <div key={user._id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)'
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: 'rgba(255,215,0,0.15)',
                        color: 'var(--color-primary)'
                      }}>
                      {user.displayName?.[0] || user.username?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold"
                        style={{ color: 'var(--color-text)' }}>
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs"
                        style={{ color: 'var(--color-text-muted)' }}>
                        @{user.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleFollow(user._id)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#0D0D0D',
                        border: 'none',
                        cursor: 'pointer'
                      }}>
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {results.hashtags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--color-text-muted)' }}>
                Hashtags
              </p>
              <div className="flex flex-wrap gap-2">
                {results.hashtags.map(tag => (
                  <span key={tag._id}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: 'rgba(255,215,0,0.08)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(255,215,0,0.2)'
                    }}>
                    #{tag.name} · {tag.postCount}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {results.posts?.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--color-text-muted)' }}>
                Posts
              </p>
              <div className="flex flex-col gap-3">
                {results.posts.map(post => (
                  <div key={post._id}
                    className="px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)'
                    }}>
                    <p className="text-xs mb-1"
                      style={{ color: 'var(--color-text-muted)' }}>
                      @{post.author?.username}
                    </p>
                    <p className="text-sm"
                      style={{ color: 'var(--color-text)' }}>
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results.users?.length === 0 &&
           results.posts?.length === 0 &&
           results.hashtags?.length === 0 && (
            <p className="text-sm text-center py-10"
              style={{ color: 'var(--color-text-muted)' }}>
              No results for "{query}"
            </p>
          )}

        </div>
      )}

    </div>
  )
}