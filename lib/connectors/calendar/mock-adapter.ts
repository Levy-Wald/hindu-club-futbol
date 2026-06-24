import type { CalendarAdapter, CalendarEventRequest, CalendarResult } from './adapter'

// Mock: no sincroniza nada real. Loguea y devuelve disponible=false. Default hasta F5.
export class MockCalendarAdapter implements CalendarAdapter {
  readonly name = 'mock'
  async pushEvent(req: CalendarEventRequest): Promise<CalendarResult> {
    console.log(`[MockCalendarAdapter] (no sincronizado) evento ${req.evento_id}: ${req.titulo}`)
    return { disponible: false, error: 'Sync de calendario externo se habilita en F5.' }
  }
  async deleteEvent(_providerEventId: string): Promise<{ ok: boolean; error?: string }> {
    return { ok: false, error: 'Sync de calendario externo se habilita en F5.' }
  }
}
