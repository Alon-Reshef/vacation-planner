import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Hotel, Session, TravelDay, UserRole } from '../types'
import {
  clearHotelFromDays,
  createTrip,
  deleteDayDb,
  deleteHotelDb,
  deleteProfile,
  fetchAppState,
  getPrimaryTripId,
  getProfile,
  insertDay,
  insertHotel,
  insertProfile,
  replaceTripData,
  tripExists,
  updateDayDb,
  updateHotelDb,
  updateTripSettings,
  updateProfileEmail,
} from '../lib/database'
import { clearLegacyLocalState, legacyToAppState, loadLegacyLocalState } from '../lib/migrate'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase'

interface AppContextValue {
  state: AppState | null
  session: Session | null
  loading: boolean
  error: string | null
  needsSetup: boolean
  canEdit: boolean
  isAdmin: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  setupAdmin: (params: {
    email: string
    password: string
    displayName: string
    tripName: string
  }) => Promise<string | null>
  addDay: (day: Omit<TravelDay, 'id'>) => Promise<void>
  updateDay: (id: string, patch: Partial<TravelDay>) => Promise<void>
  deleteDay: (id: string) => Promise<void>
  addHotel: (hotel: Omit<Hotel, 'id'>) => Promise<void>
  updateHotel: (id: string, patch: Partial<Hotel>) => Promise<void>
  deleteHotel: (id: string) => Promise<void>
  inviteUser: (user: {
    name: string
    email: string
    role: 'editor' | 'viewer'
    password: string
  }) => Promise<string | null>
  removeUser: (id: string) => Promise<void>
  updateSettings: (patch: Partial<AppState['settings']>) => Promise<void>
  changeAdminPassword: (next: string) => Promise<string | null>
  changeAdminEmail: (newEmail: string) => Promise<string | null>
  importData: (json: string) => Promise<string | null>
  exportData: () => string
}

const AppContext = createContext<AppContextValue | null>(null)

function profileToSession(profile: {
  id: string
  display_name: string
  role: UserRole
  email: string
}): Session {
  return {
    userId: profile.id,
    role: profile.role,
    displayName: profile.display_name,
    email: profile.email,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const loadTrip = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
      setLoading(false)
      return
    }

    setError(null)

    const hasTrip = await tripExists()
    if (!hasTrip) {
      setNeedsSetup(true)
      setState(null)
      setLoading(false)
      return
    }

    setNeedsSetup(false)
    const tripId = (await getPrimaryTripId())!
    const appState = await fetchAppState(tripId)
    setState(appState)
    setLoading(false)
  }, [])

  const syncSession = useCallback(async () => {
    const sb = requireSupabase()
    const { data } = await sb.auth.getSession()
    if (!data.session?.user) {
      setSession(null)
      return
    }
    const profile = await getProfile(data.session.user.id)
    if (profile) {
      setSession(
        profileToSession({
          ...profile,
          email: profile.email || data.session.user.email || '',
        }),
      )
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await syncSession()
      await loadTrip()
    })()
  }, [loadTrip, syncSession])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const sb = requireSupabase()

    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void syncSession()
    })

    const channel = sb
      .channel('vacation-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, () => void loadTrip())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'travel_days' }, () => void loadTrip())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => void loadTrip())
      .subscribe()

    return () => {
      sub.subscription.unsubscribe()
      void sb.removeChannel(channel)
    }
  }, [loadTrip, syncSession])

  const tryMigrateLegacy = useCallback(async (tripId: string, asAdmin: boolean) => {
    if (!asAdmin) return
    const legacy = loadLegacyLocalState()
    if (!legacy || (!legacy.hotels?.length && !legacy.days?.length)) return

    const current = await fetchAppState(tripId)
    if (current.hotels.length > 0 || current.days.length > 0) return

    await replaceTripData(tripId, legacyToAppState(legacy, tripId))
    clearLegacyLocalState()
    await loadTrip()
  }, [loadTrip])

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const sb = requireSupabase()
      const { error: signErr } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signErr) return signErr.message

      const { data } = await sb.auth.getUser()
      if (!data.user) return 'Sign in failed'

      const profile = await getProfile(data.user.id)
      if (!profile) return 'No profile found. Ask your trip admin to invite you.'

      setSession(profileToSession({ ...profile, email: profile.email || data.user.email || '' }))
      const tripId = await getPrimaryTripId()
      if (tripId) await tryMigrateLegacy(tripId, profile.role === 'admin')
      await loadTrip()
      return null
    },
    [loadTrip, tryMigrateLegacy],
  )

  const logout = useCallback(async () => {
    await requireSupabase().auth.signOut()
    setSession(null)
  }, [])

  const setupAdmin = useCallback(
    async (params: {
      email: string
      password: string
      displayName: string
      tripName: string
    }): Promise<string | null> => {
      const sb = requireSupabase()
      const { data: signData, error: signErr } = await sb.auth.signUp({
        email: params.email.trim(),
        password: params.password,
      })
      if (signErr) return signErr.message
      if (!signData.user) return 'Could not create account'

      const tripId = await createTrip(params.tripName)
      await insertProfile(signData.user.id, tripId, params.displayName, params.email.trim(), 'admin')

      const legacy = loadLegacyLocalState()
      if (legacy) {
        await replaceTripData(tripId, legacyToAppState(legacy, tripId))
        clearLegacyLocalState()
      }

      setSession({
        userId: signData.user.id,
        role: 'admin',
        displayName: params.displayName,
        email: params.email.trim(),
      })
      setNeedsSetup(false)
      await loadTrip()
      return null
    },
    [loadTrip],
  )

  const canEdit = session?.role === 'admin' || session?.role === 'editor'
  const isAdmin = session?.role === 'admin'

  const addDay = useCallback(
    async (day: Omit<TravelDay, 'id'>) => {
      if (!state) return
      const created = await insertDay(state.tripId, day)
      setState((s) =>
        s ? { ...s, days: [...s.days, created].sort((a, b) => a.date.localeCompare(b.date)) } : s,
      )
    },
    [state],
  )

  const updateDay = useCallback(
    async (id: string, patch: Partial<TravelDay>) => {
      if (!state) return
      await updateDayDb(id, patch)
      setState((s) =>
        s
          ? {
              ...s,
              days: s.days
                .map((d) => (d.id === id ? { ...d, ...patch } : d))
                .sort((a, b) => a.date.localeCompare(b.date)),
            }
          : s,
      )
    },
    [state],
  )

  const deleteDay = useCallback(async (id: string) => {
    await deleteDayDb(id)
    setState((s) => (s ? { ...s, days: s.days.filter((d) => d.id !== id) } : s))
  }, [])

  const addHotel = useCallback(
    async (hotel: Omit<Hotel, 'id'>) => {
      if (!state) return
      const created = await insertHotel(state.tripId, hotel)
      setState((s) => (s ? { ...s, hotels: [...s.hotels, created] } : s))
    },
    [state],
  )

  const updateHotel = useCallback(
    async (id: string, patch: Partial<Hotel>) => {
      if (!state) return
      await updateHotelDb(id, patch)
      setState((s) =>
        s ? { ...s, hotels: s.hotels.map((h) => (h.id === id ? { ...h, ...patch } : h)) } : s,
      )
    },
    [state],
  )

  const deleteHotel = useCallback(
    async (id: string) => {
      if (!state) return
      await deleteHotelDb(id)
      await clearHotelFromDays(state.tripId, id)
      setState((s) =>
        s
          ? {
              ...s,
              hotels: s.hotels.filter((h) => h.id !== id),
              days: s.days.map((d) => (d.hotelId === id ? { ...d, hotelId: null } : d)),
            }
          : s,
      )
    },
    [state],
  )

  const inviteUser = useCallback(
    async (user: {
      name: string
      email: string
      role: 'editor' | 'viewer'
      password: string
    }): Promise<string | null> => {
      if (!state) return 'Not ready'
      const sb = requireSupabase()

      const { data: before } = await sb.auth.getSession()

      const { data, error } = await sb.auth.signUp({
        email: user.email.trim(),
        password: user.password,
      })
      if (error) return error.message
      if (!data.user) return 'Could not create user'

      try {
        await insertProfile(data.user.id, state.tripId, user.name, user.email.trim(), user.role)
      } catch (e) {
        return e instanceof Error ? e.message : 'Failed to save profile'
      }

      if (before.session) {
        await sb.auth.setSession({
          access_token: before.session.access_token,
          refresh_token: before.session.refresh_token,
        })
      }

      await loadTrip()
      return null
    },
    [state, loadTrip],
  )

  const removeUser = useCallback(async (id: string) => {
    await deleteProfile(id)
    setState((s) => (s ? { ...s, members: s.members.filter((m) => m.id !== id) } : s))
  }, [])

  const updateSettings = useCallback(
    async (patch: Partial<AppState['settings']>) => {
      if (!state) return
      await updateTripSettings(state.tripId, {
        tripName: patch.tripName,
        pageTitles: patch.pageTitles,
      })
      setState((s) => (s ? { ...s, settings: { ...s.settings, ...patch } } : s))
    },
    [state],
  )

  const changeAdminPassword = useCallback(async (next: string): Promise<string | null> => {
    const { error } = await requireSupabase().auth.updateUser({ password: next })
    if (error) return error.message
    return null
  }, [])

  const changeAdminEmail = useCallback(
    async (newEmail: string): Promise<string | null> => {
      if (!session) return 'Not signed in'
      const trimmed = newEmail.trim()
      const { error } = await requireSupabase().auth.updateUser({ email: trimmed })
      if (error) return error.message
      await updateProfileEmail(session.userId, trimmed)
      setSession({ ...session, email: trimmed })
      return null
    },
    [session],
  )

  const importData = useCallback(
    async (json: string): Promise<string | null> => {
      if (!state || session?.role !== 'admin') return 'Admin only'
      try {
        const parsed = JSON.parse(json) as AppState
        await replaceTripData(state.tripId, {
          settings: parsed.settings ?? state.settings,
          hotels: parsed.hotels ?? [],
          days: parsed.days ?? [],
        })
        await loadTrip()
        return null
      } catch {
        return 'Invalid backup file'
      }
    },
    [state, session?.role, loadTrip],
  )

  const exportData = useCallback(() => {
    if (!state) return '{}'
    return JSON.stringify(state, null, 2)
  }, [state])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      session,
      loading,
      error,
      needsSetup,
      canEdit,
      isAdmin,
      refresh: loadTrip,
      login,
      logout,
      setupAdmin,
      addDay,
      updateDay,
      deleteDay,
      addHotel,
      updateHotel,
      deleteHotel,
      inviteUser,
      removeUser,
      updateSettings,
      changeAdminPassword,
      changeAdminEmail,
      importData,
      exportData,
    }),
    [
      state,
      session,
      loading,
      error,
      needsSetup,
      canEdit,
      isAdmin,
      loadTrip,
      login,
      logout,
      setupAdmin,
      addDay,
      updateDay,
      deleteDay,
      addHotel,
      updateHotel,
      deleteHotel,
      inviteUser,
      removeUser,
      updateSettings,
      changeAdminPassword,
      changeAdminEmail,
      importData,
      exportData,
    ],
  )

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-teal-50 to-amber-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full tropical-gradient" />
          <p className="text-teal-800 font-medium">Loading your vacation…</p>
        </div>
      </div>
    )
  }

  if (error && !needsSetup) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="glass-card max-w-md rounded-2xl p-6 text-center">
          <p className="text-red-700">{error}</p>
          <p className="mt-2 text-sm text-teal-700">See SUPABASE_SETUP.md in the project folder.</p>
        </div>
      </div>
    )
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
