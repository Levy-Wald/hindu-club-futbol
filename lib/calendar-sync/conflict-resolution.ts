import type { GoogleCalendarEvent } from './types'

type ClubCoreEvento = {
  id: string
  updated_at: string
}

type ConflictResult = {
  isConflict: boolean
  winner: 'local' | 'cloud'
}

/**
 * Detects conflict between a local ClubCore event and a Google event.
 * Uses last-write-wins strategy based on updated_at timestamps.
 */
export function detectConflict(
  clubCoreEvent: ClubCoreEvento,
  googleEvent: GoogleCalendarEvent,
): ConflictResult {
  if (!googleEvent.updated) {
    return { isConflict: false, winner: 'local' }
  }

  const localUpdated = new Date(clubCoreEvent.updated_at).getTime()
  const cloudUpdated = new Date(googleEvent.updated).getTime()

  if (localUpdated === cloudUpdated) {
    return { isConflict: false, winner: 'local' }
  }

  return {
    isConflict: true,
    winner: cloudUpdated > localUpdated ? 'cloud' : 'local',
  }
}
