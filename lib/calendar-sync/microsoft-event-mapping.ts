import type { MicrosoftCalendarEvent } from './types'

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

const TIMEZONE = 'Argentina Standard Time'

/**
 * Maps a ClubCore evento to a Microsoft Graph event resource.
 */
export function clubCoreToMicrosoftEvent(evento: ClubCoreEvento): Record<string, unknown> {
  const isAllDay = !evento.hora_inicio

  if (isAllDay) {
    return {
      subject: evento.titulo || evento.tipo_evento_slug,
      body: evento.descripcion
        ? { contentType: 'text', content: evento.descripcion }
        : undefined,
      isAllDay: true,
      start: { dateTime: `${evento.fecha_inicio}T00:00:00`, timeZone: TIMEZONE },
      end: { dateTime: `${addDays(evento.fecha_fin, 1)}T00:00:00`, timeZone: TIMEZONE },
      location: evento.lugar_encuentro
        ? { displayName: evento.lugar_encuentro }
        : undefined,
    }
  }

  const hi = evento.hora_inicio!
  const horaFin = evento.hora_fin ?? addHours(hi, 1)

  return {
    subject: evento.titulo || evento.tipo_evento_slug,
    body: evento.descripcion
      ? { contentType: 'text', content: evento.descripcion }
      : undefined,
    isAllDay: false,
    start: { dateTime: `${evento.fecha_inicio}T${hi}:00`, timeZone: TIMEZONE },
    end: { dateTime: `${evento.fecha_fin}T${horaFin}:00`, timeZone: TIMEZONE },
    location: evento.lugar_encuentro
      ? { displayName: evento.lugar_encuentro }
      : undefined,
  }
}

/**
 * Maps a Microsoft Graph event to partial ClubCore evento for upsert.
 */
export function microsoftEventToClubCore(msEvent: MicrosoftCalendarEvent) {
  const isAllDay = msEvent.isAllDay ?? false

  let fechaInicio: string
  let fechaFin: string
  let horaInicio: string | null = null
  let horaFin: string | null = null

  if (isAllDay) {
    // Microsoft sends dateTime like "2026-05-25T00:00:00.0000000"
    fechaInicio = msEvent.start.dateTime.split('T')[0]
    // Microsoft end is exclusive for all-day, subtract 1 day
    fechaFin = addDays(msEvent.end.dateTime.split('T')[0], -1)
  } else {
    const startDT = new Date(msEvent.start.dateTime)
    const endDT = new Date(msEvent.end.dateTime)
    fechaInicio = toDateString(startDT)
    fechaFin = toDateString(endDT)
    horaInicio = toTimeString(startDT)
    horaFin = toTimeString(endDT)
  }

  return {
    titulo: msEvent.subject || null,
    descripcion: msEvent.bodyPreview || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    lugar_encuentro: msEvent.location?.displayName || null,
  }
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
