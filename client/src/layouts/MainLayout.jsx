import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Feed', icon: '⊞', exact: true },
    { path: '/explore', label: 'Explore', icon: '🔍' },
    { path: '/reels', label: 'Reels', icon: '▶' },
    { path: '/articles', label: 'Articles', icon: '✍' },
    { path: '/forums', label: 'Forums', icon: '💬' },
    { path: '/communities', label: 'Communities', icon: '⬡' },
    { path: '/messages', label: 'Messages', icon: '✉' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
  ]

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : '400',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    backgroundColor: isActive ? 'rgba(255,215,0,0.08)' : 'transparent',
    transition: 'all 0.2s'
  })

  return (
    <div className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 px-3 py-6 z-50"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRight: '1px solid var(--color-border)'
        }}>

        {/* Logo */}
        <div className="px-3 mb-8">
          <h1 className="text-2xl font-black tracking-wider"
            style={{ color: 'var(--color-primary)' }}>
            WRLD
          </h1>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={navLinkStyle}>
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="mt-auto">
          <NavLink
            to={`/profile/${user?.username}`}
            style={navLinkStyle}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,215,0,0.15)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(255,215,0,0.3)'
              }}>
              {user?.displayName?.[0] || user?.username?.[0] || '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate"
                style={{ color: 'var(--color-text)' }}>
                {user?.displayName || user?.username}
              </span>
              <span className="text-xs truncate"
                style={{ color: 'var(--color-text-muted)' }}>
                @{user?.username}
              </span>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-1 text-sm transition-all"
            style={{
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ff5050'
              e.currentTarget.style.backgroundColor = 'rgba(255,80,80,0.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
            <span className="text-lg w-6 text-center">→</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}>
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)'
        }}>
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-primary)'
                : 'var(--color-text-muted)',
              backgroundColor: isActive
                ? 'rgba(255,215,0,0.08)'
                : 'transparent'
            })}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Profile icon on mobile */}
        <NavLink
          to={`/profile/${user?.username}`}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
          style={({ isActive }) => ({
            color: isActive
              ? 'var(--color-primary)'
              : 'var(--color-text-muted)'
          })}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: 'rgba(255,215,0,0.15)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(255,215,0,0.3)'
            }}>
            {user?.displayName?.[0] || user?.username?.[0] || '?'}
          </div>
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </nav>

    </div>
  )
}