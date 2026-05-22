import { createHash } from 'crypto'
import type { calendar_v3 } from 'googleapis'
import type { GoogleCalendarEvent } from './types'

type ClubCoreEvento = {
  id: string
  titulo: string | null
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string
  hora_inicio: string | null
  hora_fin: string | null
  lugar_encuentro: string | null
  tipo_evento_slug: string
  updated_at: string
}

const TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Maps a ClubCore evento to a Google Calendar event resource.
 */
export function clubCoreToGoogleEvent(evento: ClubCoreEvento): calendar_v3.Schema$Event {
  const isAllDay = !evento.hora_inicio

  if (isAllDay) {
    // All-day event: use date (not dateTime)
    // Google expects end date as exclusive, so add 1 day to fecha_fin
    const endDate = addDays(evento.fecha_fin, 1)
    return {
      summary: evento.titulo || evento.tipo_evento_slug,
      description: evento.descripcion || undefined,
      location: evento.lugar_encuentro || undefined,
      start: { date: evento.fecha_inicio },
      end: { date: endDate },
    }
  }

  // Timed event (hora_inicio is guaranteed non-null here)
  const hi = evento.hora_inicio!
  const startDateTime = `${evento.fecha_inicio}T${hi}:00`
  const endDateTime = evento.hora_fin
    ? `${evento.fecha_fin}T${evento.hora_fin}:00`
    : `${evento.fecha_inicio}T${addHours(hi, 1)}:00`

  return {
    summary: evento.titulo || evento.tipo_evento_slug,
    description: evento.descripcion || undefined,
    location: evento.lugar_encuentro || undefined,
    start: { dateTime: startDateTime, timeZone: TIMEZONE },
    end: { dateTime: endDateTime, timeZone: TIMEZONE },
  }
}

/**
 * Maps a Google Calendar event to a partial ClubCore evento for upsert.
 */
export function googleEventToClubCore(googleEvent: GoogleCalendarEvent) {
  const isAllDay = !!googleEvent.start.date && !googleEvent.start.dateTime

  let fechaInicio: string
  let fechaFin: string
  let horaInicio: string | null = null
  let horaFin: string | null = null

  if (isAllDay) {
    fechaInicio = googleEvent.start.date!
    // Google end date is exclusive for all-day events, subtract 1 day
    fechaFin = addDays(googleEvent.end.date!, -1)
  } else {
    const startDT = new Date(googleEvent.start.dateTime!)
    const endDT = new Date(googleEvent.end.dateTime!)
    fechaInicio = toDateString(startDT)
    fechaFin = toDateString(endDT)
    horaInicio = toTimeString(startDT)
    horaFin = toTimeString(endDT)
  }

  return {
    titulo: googleEvent.summary || null,
    descripcion: googleEvent.description || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    lugar_encuentro: googleEvent.location || null,
  }
}

/**
 * Computes a SHA-256 hash of the event's sync-relevant fields.
 */
export function computeEventHash(evento: ClubCoreEvento): string {
  const payload = JSON.stringify({
    titulo: evento.titulo,
    descripcion: evento.descripcion,
    fecha_inicio: evento.fecha_inicio,
    fecha_fin: evento.fecha_fin,
    hora_inicio: evento.hora_inicio,
    hora_fin: evento.hora_fin,
    lugar_encuentro: evento.lugar_encuentro,
  })
  return createHash('sha256').update(payload).digest('hex')
}

/**
 * Returns true if two hashes match (events are equal).
 */
export function eventsEqual(hash1: string, hash2: string): boolean {
  return hash1 === hash2
}

// ── Helpers ──

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const newH = Math.min(h + hours, 23)
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function toTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
