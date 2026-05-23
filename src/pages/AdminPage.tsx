import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { DEFAULT_PAGE_TITLES, type PageTitles } from '../types'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from '../components/ui'

export function AdminPage() {
  const {
    state,
    isAdmin,
    session,
    inviteUser,
    removeUser,
    updateSettings,
    changeAdminPassword,
    changeAdminEmail,
    exportData,
    importData,
  } = useApp()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
  const [password, setPassword] = useState('')
  const [titles, setTitles] = useState<PageTitles>(DEFAULT_PAGE_TITLES)
  const [tripName, setTripName] = useState('My Tropical Getaway')
  const [pwNew, setPwNew] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')

  useEffect(() => {
    if (!state) return
    setTitles(state.settings.pageTitles)
    setTripName(state.settings.tripName)
  }, [state])

  useEffect(() => {
    if (session?.email) setAdminEmail(session.email)
  }, [session?.email])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!state) {
    return null
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon="🔒"
        title="Admin only"
        description="You are signed in as a guest with limited permissions. Only the trip admin can manage users and settings."
      />
    )
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    const err = await inviteUser({ name, email, role, password })
    if (err) {
      alert(err)
      return
    }
    setInviteOpen(false)
    setName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
  }

  async function saveTitles(e: FormEvent) {
    e.preventDefault()
    await updateSettings({ pageTitles: titles, tripName })
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    const err = await changeAdminPassword(pwNew)
    if (err) {
      setPwMsg(err)
      return
    }
    setPwMsg('Password updated successfully')
    setPwNew('')
  }

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault()
    const err = await changeAdminEmail(adminEmail)
    if (err) {
      setEmailMsg(err)
      return
    }
    setEmailMsg('Email updated. Use the new address next time you sign in.')
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vacation-plan-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        void (async () => {
          const err = await importData(reader.result as string)
          if (err) alert(err)
          else alert('Backup restored successfully')
        })()
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <>
      <PageHeader
        title={state.settings.pageTitles.admin}
        subtitle="Manage users, page titles, and trip settings"
        action={<Badge tone="amber">Admin</Badge>}
      />

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-lg font-semibold text-teal-900">Trip & page titles</h2>
        <form onSubmit={saveTitles} className="glass-card space-y-4 rounded-2xl p-4">
          <Field label="Trip name (shown at top)">
            <Input value={tripName} onChange={(e) => setTripName(e.target.value)} />
          </Field>
          <Field label="Home page title">
            <Input
              value={titles.home}
              onChange={(e) => setTitles({ ...titles, home: e.target.value })}
            />
          </Field>
          <Field label="Hotels page title">
            <Input
              value={titles.hotels}
              onChange={(e) => setTitles({ ...titles, hotels: e.target.value })}
            />
          </Field>
          <Field label="Admin page title">
            <Input
              value={titles.admin}
              onChange={(e) => setTitles({ ...titles, admin: e.target.value })}
            />
          </Field>
          <Button type="submit">Save titles</Button>
        </form>
      </section>

      <section className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-teal-900">Invited users</h2>
          <Button onClick={() => setInviteOpen(true)}>+ Invite</Button>
        </div>

        {state.members.length === 0 ? (
          <p className="text-sm text-teal-700/75">
            No invited users yet. Invite family or travel partners with view or edit access.
          </p>
        ) : (
          <ul className="space-y-3">
            {state.members.map((u) => (
              <li key={u.id} className="glass-card flex items-center justify-between rounded-xl p-3">
                <div>
                  <p className="font-medium text-teal-900">{u.name}</p>
                  <p className="text-xs text-teal-600">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={u.role === 'editor' ? 'green' : 'teal'}>{u.role}</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${u.name}?`)) removeUser(u.id)
                    }}
                    className="text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl bg-teal-50/80 p-3 text-xs text-teal-800">
          <strong>Permissions:</strong> Viewers can read the itinerary. Editors can add days and hotels.
          Only you (admin) can access this page and change titles.
        </div>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-lg font-semibold text-teal-900">Admin email</h2>
        <form onSubmit={handleEmailChange} className="glass-card space-y-3 rounded-2xl p-4">
          {emailMsg && <p className="text-sm text-teal-700">{emailMsg}</p>}
          <Field label="Sign-in email" hint="This is the email you use to log in">
            <Input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </Field>
          <Button type="submit">Update email</Button>
        </form>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-lg font-semibold text-teal-900">Change admin password</h2>
        <form onSubmit={handlePasswordChange} className="glass-card space-y-3 rounded-2xl p-4">
          {pwMsg && <p className="text-sm text-teal-700">{pwMsg}</p>}
          <Field label="New password">
            <Input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Button type="submit">Update password</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-teal-900">Backup & restore</h2>
        <p className="text-sm text-teal-700/75">
          Data is stored in Supabase and syncs across devices. Export a JSON backup for extra safety.
        </p>
        <p className="text-xs text-teal-600/70">
          In Supabase Dashboard → Authentication, turn off &quot;Confirm email&quot; so invited users can sign in immediately.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            Import JSON
          </Button>
        </div>
      </section>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user">
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email (used to sign in)">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Permission">
            <Select value={role} onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}>
              <option value="viewer">Viewer — read only</option>
              <option value="editor">Editor — can add & edit</option>
            </Select>
          </Field>
          <Field label="Password for this user">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Button type="submit" className="w-full">
            Send invite
          </Button>
        </form>
      </Modal>
    </>
  )
}
