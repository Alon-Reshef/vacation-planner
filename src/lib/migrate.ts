import type { AppState, LegacyAppState } from '../types'
import { DEFAULT_PAGE_TITLES } from '../types'

const LEGACY_KEY = 'vacation-planner-state'

export function loadLegacyLocalState(): LegacyAppState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LegacyAppState
  } catch {
    return null
  }
}

export function legacyToAppState(legacy: LegacyAppState, tripId: string): Omit<AppState, 'members'> {
  return {
    tripId,
    settings: {
      tripName: legacy.settings.tripName ?? 'My Tropical Getaway',
      pageTitles: legacy.settings.pageTitles ?? DEFAULT_PAGE_TITLES,
    },
    hotels: legacy.hotels ?? [],
    days: legacy.days ?? [],
  }
}

export function clearLegacyLocalState(): void {
  localStorage.removeItem(LEGACY_KEY)
}
