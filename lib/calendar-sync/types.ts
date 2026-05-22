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
