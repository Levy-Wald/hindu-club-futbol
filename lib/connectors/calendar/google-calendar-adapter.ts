import type { CalendarAdapter, CalendarEventRequest, CalendarResult } from './adapter'

// ============================================================================
// STUB F5 — Google Calendar. NO implementar hasta tener OAuth de Google
// configurado (consent screen + credenciales) — post-CUIT.
// ----------------------------------------------------------------------------
// El seam ya está: implementar pushEvent/deleteEvent contra Calendar API v3
// (events.insert / events.update / events.delete) usando el refresh_token del
// usuario (guardado en calendario_integraciones). Setear GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET + CALENDAR_MODE=google. Outlook (Microsoft Graph) y
// iCloud (CalDAV) son adapters análogos a futuro.
// Ref: https://developers.google.com/calendar/api/v3/reference/events
// ============================================================================
export class GoogleCalendarAdapter implements CalendarAdapter {
  readonly name = 'google'
  async pushEvent(_req: CalendarEventRequest): Promise<CalendarResult> {
    throw new Error('GoogleCalendarAdapter.pushEvent no implementado (F5).')
  }
  async deleteEvent(_providerEventId: string): Promise<{ ok: boolean; error?: string }> {
    throw new Error('GoogleCalendarAdapter.deleteEvent no implementado (F5).')
  }
}
