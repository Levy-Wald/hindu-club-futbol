// F5 pre-cableado — Adapter de sync de calendarios externos (Google / Outlook /
// iCloud-CalDAV). ADR-035 mock-first. La persistencia del mapeo evento↔externo ya
// existe en DB (evento_sync_map, calendario_integraciones); este seam es la
// frontera con la API externa (push/borrado del evento en el calendario del user).
// Alcance MVP: one-way (evento del club → calendario del socio). Bidireccional = F5+.

export interface CalendarEventRequest {
  /** id interno del evento (para reconciliar con evento_sync_map) */
  evento_id: string
  titulo: string
  /** ISO 8601 */
  inicio: string
  fin?: string | null
  descripcion?: string | null
  ubicacion?: string | null
  /** id del evento en el proveedor (presente → update; ausente → create) */
  provider_event_id?: string | null
}

export interface CalendarResult {
  /** false en mock / cuando el sync externo no está habilitado todavía */
  disponible: boolean
  provider_event_id?: string
  error?: string
}

export interface CalendarAdapter {
  readonly name: string
  /** crea o actualiza el evento en el calendario externo */
  pushEvent(req: CalendarEventRequest): Promise<CalendarResult>
  /** borra el evento del calendario externo */
  deleteEvent(providerEventId: string): Promise<{ ok: boolean; error?: string }>
}
