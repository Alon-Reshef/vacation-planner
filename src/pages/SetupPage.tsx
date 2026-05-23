import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Button, Field, Input } from '../components/ui'

export function SetupPage() {
  const { setupAdmin } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tripName, setTripName] = useState('My Tropical Getaway')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await setupAdmin({ email, password, displayName, tripName })
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <span className="text-5xl" role="img" aria-hidden>
            🌴
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold text-teal-900">Set up your trip</h1>
          <p className="mt-2 text-teal-700/80">
            Create your admin account. Data will sync to Supabase across all your devices.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-4 rounded-3xl p-6">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Field label="Your name">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </Field>
          <Field label="Admin email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password" hint="At least 6 characters">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <Field label="Trip name">
            <Input value={tripName} onChange={(e) => setTripName(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create trip & admin account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
