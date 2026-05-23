import type { AppState, Hotel, PageTitles, TravelDay, TripMember, UserRole } from '../types'
import { DEFAULT_PAGE_TITLES } from '../types'
import { requireSupabase } from './supabase'

type TripRow = {
  id: string
  trip_name: string
  page_titles: PageTitles
}

type HotelRow = {
  id: string
  trip_id: string
  name: string
  address: string
  check_in: string | null
  check_out: string | null
  confirmation: string
  phone: string
  notes: string
}

type DayRow = {
  id: string
  trip_id: string
  date: string
  hotel_id: string | null
  activities: string
  travel_to_next: string
  notes: string
}

export type ProfileRow = {
  id: string
  trip_id: string
  display_name: string
  email: string
  role: UserRole
}

function mapHotel(row: HotelRow): Hotel {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    checkIn: row.check_in ?? '',
    checkOut: row.check_out ?? '',
    confirmation: row.confirmation ?? '',
    phone: row.phone ?? '',
    notes: row.notes ?? '',
  }
}

function mapDay(row: DayRow): TravelDay {
  return {
    id: row.id,
    date: row.date,
    hotelId: row.hotel_id,
    activities: row.activities ?? '',
    travelToNext: row.travel_to_next ?? '',
    notes: row.notes ?? '',
  }
}

function hotelInsert(tripId: string, hotel: Omit<Hotel, 'id'>) {
  return {
    trip_id: tripId,
    name: hotel.name,
    address: hotel.address,
    check_in: hotel.checkIn || null,
    check_out: hotel.checkOut || null,
    confirmation: hotel.confirmation,
    phone: hotel.phone,
    notes: hotel.notes,
  }
}

function dayInsert(tripId: string, day: Omit<TravelDay, 'id'>) {
  return {
    trip_id: tripId,
    date: day.date,
    hotel_id: day.hotelId,
    activities: day.activities,
    travel_to_next: day.travelToNext,
    notes: day.notes,
  }
}

export async function getPrimaryTripId(): Promise<string | null> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('trips').select('id').order('created_at').limit(1).maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function tripExists(): Promise<boolean> {
  return (await getPrimaryTripId()) !== null
}

export async function fetchAppState(tripId: string): Promise<AppState> {
  const sb = requireSupabase()

  const [tripRes, hotelsRes, daysRes] = await Promise.all([
    sb.from('trips').select('*').eq('id', tripId).single(),
    sb.from('hotels').select('*').eq('trip_id', tripId).order('check_in'),
    sb.from('travel_days').select('*').eq('trip_id', tripId).order('date'),
  ])

  if (tripRes.error) throw tripRes.error
  if (hotelsRes.error) throw hotelsRes.error
  if (daysRes.error) throw daysRes.error

  const trip = tripRes.data as TripRow

  // Profiles are admin-only in RLS — skip for guests (not signed in)
  let members: TripMember[] = []
  const { data: authData } = await sb.auth.getSession()
  if (authData.session) {
    const profilesRes = await sb
      .from('profiles')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at')
    if (profilesRes.error) throw profilesRes.error
    members = (profilesRes.data as ProfileRow[])
      .filter((p) => p.role !== 'admin')
      .map((p) => ({
        id: p.id,
        name: p.display_name,
        email: p.email,
        role: p.role as 'editor' | 'viewer',
      }))
  }

  return {
    tripId,
    settings: {
      tripName: trip.trip_name,
      pageTitles: trip.page_titles ?? DEFAULT_PAGE_TITLES,
    },
    hotels: (hotelsRes.data as HotelRow[]).map(mapHotel),
    days: (daysRes.data as DayRow[]).map(mapDay),
    members,
  }
}

export async function createTrip(tripName: string): Promise<string> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('trips')
    .insert({ trip_name: tripName, page_titles: DEFAULT_PAGE_TITLES })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateTripSettings(
  tripId: string,
  patch: { tripName?: string; pageTitles?: PageTitles },
): Promise<void> {
  const sb = requireSupabase()
  const row: Record<string, unknown> = {}
  if (patch.tripName !== undefined) row.trip_name = patch.tripName
  if (patch.pageTitles !== undefined) row.page_titles = patch.pageTitles
  const { error } = await sb.from('trips').update(row).eq('id', tripId)
  if (error) throw error
}

export async function insertHotel(tripId: string, hotel: Omit<Hotel, 'id'>): Promise<Hotel> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('hotels').insert(hotelInsert(tripId, hotel)).select().single()
  if (error) throw error
  return mapHotel(data as HotelRow)
}

export async function updateHotelDb(id: string, patch: Partial<Hotel>): Promise<void> {
  const sb = requireSupabase()
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.address !== undefined) row.address = patch.address
  if (patch.checkIn !== undefined) row.check_in = patch.checkIn || null
  if (patch.checkOut !== undefined) row.check_out = patch.checkOut || null
  if (patch.confirmation !== undefined) row.confirmation = patch.confirmation
  if (patch.phone !== undefined) row.phone = patch.phone
  if (patch.notes !== undefined) row.notes = patch.notes
  const { error } = await sb.from('hotels').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteHotelDb(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('hotels').delete().eq('id', id)
  if (error) throw error
}

export async function insertDay(tripId: string, day: Omit<TravelDay, 'id'>): Promise<TravelDay> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('travel_days').insert(dayInsert(tripId, day)).select().single()
  if (error) throw error
  return mapDay(data as DayRow)
}

export async function updateDayDb(id: string, patch: Partial<TravelDay>): Promise<void> {
  const sb = requireSupabase()
  const row: Record<string, unknown> = {}
  if (patch.date !== undefined) row.date = patch.date
  if (patch.hotelId !== undefined) row.hotel_id = patch.hotelId
  if (patch.activities !== undefined) row.activities = patch.activities
  if (patch.travelToNext !== undefined) row.travel_to_next = patch.travelToNext
  if (patch.notes !== undefined) row.notes = patch.notes
  const { error } = await sb.from('travel_days').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteDayDb(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('travel_days').delete().eq('id', id)
  if (error) throw error
}

export async function clearHotelFromDays(tripId: string, hotelId: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb
    .from('travel_days')
    .update({ hotel_id: null })
    .eq('trip_id', tripId)
    .eq('hotel_id', hotelId)
  if (error) throw error
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as ProfileRow | null
}

export async function insertProfile(
  userId: string,
  tripId: string,
  displayName: string,
  email: string,
  role: UserRole,
): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('profiles').insert({
    id: userId,
    trip_id: tripId,
    display_name: displayName,
    email,
    role,
  })
  if (error) throw error
}

export async function deleteProfile(userId: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('profiles').delete().eq('id', userId)
  if (error) throw error
}

export async function updateProfileEmail(userId: string, email: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('profiles').update({ email }).eq('id', userId)
  if (error) throw error
}

export async function replaceTripData(tripId: string, state: Omit<AppState, 'tripId' | 'members'>): Promise<void> {
  await updateTripSettings(tripId, {
    tripName: state.settings.tripName,
    pageTitles: state.settings.pageTitles,
  })

  const sb = requireSupabase()
  await sb.from('travel_days').delete().eq('trip_id', tripId)
  await sb.from('hotels').delete().eq('trip_id', tripId)

  const idMap = new Map<string, string>()
  for (const h of state.hotels) {
    const inserted = await insertHotel(tripId, h)
    idMap.set(h.id, inserted.id)
  }
  for (const d of state.days) {
    await insertDay(tripId, {
      ...d,
      hotelId: d.hotelId ? (idMap.get(d.hotelId) ?? null) : null,
    })
  }
}
