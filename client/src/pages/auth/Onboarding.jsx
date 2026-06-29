import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const WORLDS = [
  { id: 'stem', label: 'STEM', emoji: '🔬' },
  { id: 'arts_humanities', label: 'Arts & Humanities', emoji: '🎨' },
  { id: 'finance', label: 'Finance', emoji: '📈' },
  { id: 'law', label: 'Law', emoji: '⚖️' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'medicine_health', label: 'Medicine & Health', emoji: '🏥' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'careers', label: 'Careers', emoji: '🚀' },
  { id: 'creative', label: 'Creative Arts', emoji: '✨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'movies', label: 'Movies & Film', emoji: '🎬' },
  { id: 'anime', label: 'Anime & Manga', emoji: '⛩️' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
  { id: 'books', label: 'Books & Literature', emoji: '📖' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
  { id: 'design', label: 'Design', emoji: '🖌️' },
  { id: 'fashion', label: 'Fashion & Style', emoji: '👗' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
  { id: 'food', label: 'Food & Cooking', emoji: '🍜' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'entertainment_industry', label: 'Entertainment Industry', emoji: '🎤' },
  { id: 'content_creator', label: 'Content Creator', emoji: '📱' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'pets', label: 'Pets & Animals', emoji: '🐾' },
  { id: 'nature', label: 'Nature & Environment', emoji: '🌿' },
  { id: 'home', label: 'Home & Living', emoji: '🏠' },
  { id: 'faith_spirituality', label: 'Faith & Spirituality', emoji: '🕊️' },
  { id: 'mental_health', label: 'Mental Health', emoji: '🧠' },
  { id: 'philosophy', label: 'Philosophy', emoji: '🤔' },
  { id: 'politics_society', label: 'Politics & Society', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'ai_ml', label: 'AI & Machine Learning', emoji: '🤖' },
  { id: 'crypto_web3', label: 'Crypto & Web3', emoji: '🔗' },
  { id: 'space', label: 'Space & Astronomy', emoji: '🪐' },
]

const PURPOSES = [
  { id: 'just_having_fun', label: 'Just having fun', emoji: '🎉' },
  { id: 'building_career', label: 'Building my career', emoji: '💼' },
  { id: 'learning', label: 'Learning something new', emoji: '📖' },
  { id: 'networking', label: 'Networking', emoji: '🤝' },
  { id: 'building_business', label: 'Building a business', emoji: '🏗️' },
  { id: 'creating_content', label: 'Creating content', emoji: '🎥' },
  { id: 'finding_community', label: 'Finding my community', emoji: '👥' },
  { id: 'exploring', label: 'Just exploring', emoji: '🧭' },
  { id: 'mentoring_others', label: 'Mentoring others', emoji: '🌟' },
  { id: 'being_mentored', label: 'Finding a mentor', emoji: '🎯' },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [selectedWorlds, setSelectedWorlds] = useState([])
  const [selectedPurposes, setSelectedPurposes] = useState([])
  const [careerProfile, setCareerProfile] = useState({
    sector: '',
    role: '',
    experience: 'not_sure'
  })
  const [loading, setLoading] = useState(false)
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const toggleWorld = (id) => {
    setSelectedWorlds(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    )
  }

  const togglePurpose = (id) => {
    setSelectedPurposes(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await axios.patch(`${API}/api/users/profile/purpose`, {
        worlds: selectedWorlds,
        purpose: selectedPurposes
      })
      await axios.patch(`${API}/api/users/profile/update`, {
        careerProfile
      })
      updateUser({
        worlds: selectedWorlds,
        purpose: selectedPurposes,
        careerProfile
      })
      navigate('/')
    } catch (err) {
      console.error(err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = (selected) => ({
    backgroundColor: selected ? 'rgba(255,215,0,0.1)' : 'var(--color-bg-surface)',
    border: selected ? '1px solid rgba(255,215,0,0.5)' : '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  })

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.14) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse'
        }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-wider mb-2"
            style={{ color: 'var(--color-primary)' }}>
            WRLD
          </h1>
          <h2 className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text)' }}>
            {step === 1
              ? `Welcome, ${user?.displayName || user?.username} 👋`
              : step === 2
              ? 'What brings you to WRLD?'
              : 'Tell us about yourself'}
          </h2>
          <p className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}>
            {step === 1
              ? 'Pick the worlds you want to be part of. You can always change this later.'
              : step === 2
              ? 'Pick everything that applies. No wrong answers.'
              : 'Help us personalise your experience. Completely optional.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="h-1.5 rounded-full transition-all"
              style={{
                width: step === s ? '32px' : '16px',
                backgroundColor: step >= s
                  ? 'var(--color-primary)'
                  : 'var(--color-border)'
              }} />
          ))}
        </div>

        {/* Step 1 — Worlds */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {WORLDS.map(world => (
                <button
                  key={world.id}
                  onClick={() => toggleWorld(world.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={cardStyle(selectedWorlds.includes(world.id))}>
                  <span className="text-xl">{world.emoji}</span>
                  <span className="text-sm font-medium"
                    style={{
                      color: selectedWorlds.includes(world.id)
                        ? 'var(--color-primary)'
                        : 'var(--color-text)'
                    }}>
                    {world.label}
                  </span>
                  {selectedWorlds.includes(world.id) && (
                    <span className="ml-auto text-xs font-bold"
                      style={{ color: 'var(--color-primary)' }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}>
                Skip for now
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#0D0D0D',
                  cursor: 'pointer'
                }}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Purpose */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {PURPOSES.map(purpose => (
                <button
                  key={purpose.id}
                  onClick={() => togglePurpose(purpose.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={cardStyle(selectedPurposes.includes(purpose.id))}>
                  <span className="text-xl">{purpose.emoji}</span>
                  <span className="text-sm font-medium"
                    style={{
                      color: selectedPurposes.includes(purpose.id)
                        ? 'var(--color-primary)'
                        : 'var(--color-text)'
                    }}>
                    {purpose.label}
                  </span>
                  {selectedPurposes.includes(purpose.id) && (
                    <span className="ml-auto text-xs font-bold"
                      style={{ color: 'var(--color-primary)' }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}>
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#0D0D0D',
                  cursor: 'pointer'
                }}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Career */}
        {step === 3 && (
          <div className="flex flex-col gap-4 mb-8">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--color-text-muted)' }}>
                Your Sector
                <span className="ml-2 normal-case font-normal tracking-normal"
                  style={{ color: 'var(--color-text-faint)' }}>
                  (optional)
                </span>
              </label>
              <input
                value={careerProfile.sector}
                onChange={e => setCareerProfile({
                  ...careerProfile, sector: e.target.value
                })}
                placeholder="e.g. Technology, Medicine, Law, Arts..."
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
                Your Role
                <span className="ml-2 normal-case font-normal tracking-normal"
                  style={{ color: 'var(--color-text-faint)' }}>
                  (optional)
                </span>
              </label>
              <input
                value={careerProfile.role}
                onChange={e => setCareerProfile({
                  ...careerProfile, role: e.target.value
                })}
                placeholder="e.g. Software Engineer, Student, Designer..."
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
                Where are you in your journey?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'student', label: 'Student', emoji: '🎓' },
                  { id: 'entry_level', label: 'Entry Level', emoji: '🌱' },
                  { id: 'mid_level', label: 'Mid Level', emoji: '📈' },
                  { id: 'senior', label: 'Senior', emoji: '⭐' },
                  { id: 'executive', label: 'Executive', emoji: '👔' },
                  { id: 'freelance', label: 'Freelance', emoji: '💻' },
                  { id: 'entrepreneur', label: 'Entrepreneur', emoji: '🚀' },
                  { id: 'creative_professional', label: 'Creative Professional', emoji: '🎭' },
                  { id: 'not_sure', label: 'Not sure yet', emoji: '🧭' },
                ].map(exp => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setCareerProfile({
                      ...careerProfile, experience: exp.id
                    })}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: careerProfile.experience === exp.id
                        ? 'rgba(255,215,0,0.1)'
                        : 'var(--color-bg-surface)',
                      border: careerProfile.experience === exp.id
                        ? '1px solid rgba(255,215,0,0.5)'
                        : '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}>
                    <span>{exp.emoji}</span>
                    <span className="text-xs font-medium"
                      style={{
                        color: careerProfile.experience === exp.id
                          ? 'var(--color-primary)'
                          : 'var(--color-text)'
                      }}>
                      {exp.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}>
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: loading
                    ? 'var(--color-text-faint)'
                    : 'var(--color-primary)',
                  color: '#0D0D0D',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                {loading ? 'Setting up...' : 'Enter WRLD 🌍'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}