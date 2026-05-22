import { z } from 'zod'

// ── DB types ──

export type Proveedor = 'google' | 'microsoft' | 'icloud'

export type IntegracionEstado = 'connected' | 'disconnected' | 'error' | 'expired'

export type SyncDirection = 'two-way' | 'read-only' | 'write-only'

export type CalendarioIntegracion = {
  id: string
  tenant_id: string
  persona_id: string
  proveedor: Proveedor
  estado: IntegracionEstado

  // Google-specific
  google_calendar_id: string | null
  google_refresh_token: string | null
  google_access_token: string | null
  google_token_expires_at: string | null

  // Microsoft-specific
  microsoft_calendar_id: string | null
  microsoft_refresh_token: string | null
  microsoft_access_token: string | null
  microsoft_token_expires_at: string | null

  // iCloud-specific
  icloud_email: string | null
  icloud_app_password: string | null
  icloud_calendar_url: string | null
  icloud_calendar_etag: string | null

  // Common
  sync_direction: SyncDirection
  last_sync_at: string | null
  next_sync_at: string | null
  error_log: Record<string, unknown>[] | null

  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type SyncMapDirection = 'local→cloud' | 'cloud→local' | 'bidirectional'

export type EventoSyncMap = {
  id: string
  evento_id: string
  proveedor: Proveedor
  evento_id_externo: string
  hash_sync: string
  synced_at: string
  sync_direction: SyncMapDirection

  errores: Record<string, unknown>[] | null
  created_at: string
  updated_at: string
}

// ── Google Calendar API types ──

export type GoogleCalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: { email: string; responseStatus: string }[]
  location?: string
  recurrence?: string[]
  organizer?: { email: string }
  updated?: string
  status?: string
}

export type GoogleCalendarListEntry = {
  id: string
  summary: string
  primary?: boolean
  accessRole: string
}

// ── Microsoft Calendar API types ──

export type MicrosoftCalendarEvent = {
  id: string
  subject: string
  bodyPreview?: string
  body?: { contentType: string; content: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  isAllDay?: boolean
  attendees?: { emailAddress: { address: string; name?: string }; status: { response: string } }[]
  location?: { displayName?: string }
  organizer?: { emailAddress: { address: string; name?: string } }
  lastModifiedDateTime?: string
  isCancelled?: boolean
}

export type MicrosoftCalendarListEntry = {
  id: string
  name: string
  isDefaultCalendar?: boolean
  canEdit: boolean
}

// ── iCloud CalDAV types ──

export type ICloudCalendarEvent = {
  uid: string
  summary: string
  description?: string
  dtstart: string       // ISO datetime or date
  dtend: string         // ISO datetime or date
  isAllDay: boolean
  location?: string
  lastModified?: string // ISO datetime
  etag?: string
  status?: string       // CONFIRMED, TENTATIVE, CANCELLED
}

// ── Zod schemas ──

export const CreateIntegracionSchema = z.object({
  proveedor: z.enum(['google', 'microsoft', 'icloud']),
  google_calendar_id: z.string().optional(),
  google_refresh_token: z.string().min(1),
  google_access_token: z.string().min(1),
  google_token_expires_at: z.string(),
  sync_direction: z.enum(['two-way', 'read-only', 'write-only']).default('two-way'),
})

export type CreateIntegracionInput = z.infer<typeof CreateIntegracionSchema>

export const UpdateSyncMapSchema = z.object({
  hash_sync: z.string().optional(),
  sync_direction: z.enum(['local→cloud', 'cloud→local', 'bidirectional']).optional(),
})
