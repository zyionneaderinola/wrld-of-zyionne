import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// Main layout
import MainLayout from './layouts/MainLayout'

// Main pages
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import Reels from './pages/Reels'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Articles from './pages/Articles'
import Forums from './pages/Forums'
import Communities from './pages/Communities'
import Stories from './pages/Stories'

// Loading
import Splash from './pages/Splash'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Feed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="reels" element={<Reels />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="articles" element={<Articles />} />
        <Route path="forums" element={<Forums />} />
        <Route path="communities" element={<Communities />} />
        <Route path="stories" element={<Stories />} />
        <Route path="profile/:username" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App