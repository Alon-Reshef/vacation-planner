export type UserRole = 'admin' | 'editor' | 'viewer'

export interface TripMember {
  id: string
  name: string
  email: string
  role: Exclude<UserRole, 'admin'>
}

export interface PageTitles {
  home: string
  hotels: string
  admin: string
}

export interface TripSettings {
  tripName: string
  pageTitles: PageTitles
}

export interface TravelDay {
  id: string
  date: string
  hotelId: string | null
  activities: string
  travelToNext: string
  notes: string
}

export interface Hotel {
  id: string
  name: string
  address: string
  checkIn: string
  checkOut: string
  confirmation: string
  phone: string
  notes: string
}

export interface Session {
  userId: string
  role: UserRole
  displayName: string
  email: string
}

export interface AppState {
  tripId: string
  settings: TripSettings
  days: TravelDay[]
  hotels: Hotel[]
  members: TripMember[]
}

export const DEFAULT_PAGE_TITLES: PageTitles = {
  home: 'Vacation Plan',
  hotels: 'Hotels',
  admin: 'Admin',
}

/** @deprecated Old local backup format */
export interface LegacyAppState {
  settings: TripSettings & {
    admin?: { username: string; passwordHash: string }
  }
  days: TravelDay[]
  hotels: Hotel[]
  users?: { id: string; name: string; email: string; role: string; passwordHash?: string }[]
}
