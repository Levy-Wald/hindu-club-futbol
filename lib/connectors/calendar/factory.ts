import type { CalendarAdapter } from './adapter'
import { MockCalendarAdapter } from './mock-adapter'
import { GoogleCalendarAdapter } from './google-calendar-adapter'

let cached: CalendarAdapter | null = null

// Resuelve el adapter de calendario según CALENDAR_MODE (default 'mock').
// En F5: CALENDAR_MODE=google (+ OAuth de Google). Outlook (Microsoft Graph) y
// caldav (iCloud) son adapters análogos a implementar a futuro.
export function resolveCalendarAdapter(): CalendarAdapter {
  if (cached) return cached
  const mode = process.env.CALENDAR_MODE || 'mock'
  switch (mode) {
    case 'mock':
      cached = new MockCalendarAdapter()
      break
    case 'google':
      cached = new GoogleCalendarAdapter()
      break
    case 'outlook':
    case 'caldav':
      throw new Error(`CALENDAR_MODE=${mode} todavía no implementado (F5+).`)
    default:
      throw new Error(`CALENDAR_MODE desconocido: ${mode}. Válidos: mock | google | outlook | caldav`)
  }
  return cached
}
