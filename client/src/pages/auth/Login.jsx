import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ emailOrUsername: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.emailOrUsername, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-wider mb-2"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-primary)' }}>
            WRLD
          </h1>
          <p className="text-sm tracking-widest uppercase"
            style={{ color: 'var(--color-text-muted)' }}>
            Your world. Unlimited.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}>

          <h2 className="text-xl font-bold mb-6"
            style={{ color: 'var(--color-text)' }}>
            Welcome back
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255, 80, 80, 0.1)',
                border: '1px solid rgba(255, 80, 80, 0.3)',
                color: '#ff5050'
              }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--color-text-muted)' }}>
                Email or Username
              </label>
              <input
                name="emailOrUsername"
                value={form.emailOrUsername}
                onChange={handleChange}
                placeholder="Enter your email or username"
                required
                className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-primary)'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--color-text-muted)' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-primary)'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all mt-2"
              style={{
                backgroundColor: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                color: '#0D0D0D',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          <p className="text-center text-sm mt-6"
            style={{ color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register"
              className="font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              Join WRLD
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}