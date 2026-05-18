'use server'

import { createClient } from '@/lib/supabase/server'
import {
  trayectoriaClubInputSchema,
  trayectoriaClubUpdateSchema,
  logroInputSchema,
  logroUpdateSchema,
} from './schema'
import type { TrayectoriaClubInput, TrayectoriaClubUpdate, LogroInput, LogroUpdate } from './schema'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// --- Trayectoria clubes ---

export async function crearTrayectoriaClub(input: TrayectoriaClubInput) {
  const parsed = trayectoriaClubInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { persona_id, ...rest } = parsed.data
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('persona_trayectoria_clubes')
    .insert({
      tenant_id: TENANT_ID,
      persona_id,
      club_nombre: rest.club_nombre,
      club_pais: rest.club_pais || null,
      club_ciudad: rest.club_ciudad || null,
      disciplina_slug: rest.disciplina_slug || null,
      categoria: rest.categoria || null,
      posicion: rest.posicion || null,
      numero_camiseta: rest.numero_camiseta ?? null,
      fecha_desde: rest.fecha_desde || null,
      fecha_hasta: rest.fecha_hasta || null,
      partidos_jugados: rest.partidos_jugados ?? null,
      goles: rest.goles ?? null,
      asistencias: rest.asistencias ?? null,
      observaciones: rest.observaciones || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id }
}

export async function actualizarTrayectoriaClub(id: string, input: TrayectoriaClubUpdate) {
  const parsed = trayectoriaClubUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createClient()
  const updateData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    updateData[k] = v === undefined ? undefined : (v || null)
  }

  const { error } = await (supabase as any)
    .from('persona_trayectoria_clubes')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function softDeleteTrayectoriaClub(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('persona_trayectoria_clubes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// --- Logros ---

export async function crearLogro(input: LogroInput) {
  const parsed = logroInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { persona_id, ...rest } = parsed.data
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('persona_logros')
    .insert({
      tenant_id: TENANT_ID,
      persona_id,
      tipo_logro: rest.tipo_logro,
      descripcion: rest.descripcion,
      torneo_nombre: rest.torneo_nombre || null,
      equipo_nombre: rest.equipo_nombre || null,
      anio: rest.anio ?? null,
      fecha_otorgado: rest.fecha_otorgado || null,
      archivo_evidencia_url: rest.archivo_evidencia_url || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id }
}

export async function actualizarLogro(id: string, input: LogroUpdate) {
  const parsed = logroUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('persona_logros')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function softDeleteLogro(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('persona_logros')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
