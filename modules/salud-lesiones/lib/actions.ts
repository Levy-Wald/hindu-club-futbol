'use server'

import { createClient } from '@/lib/supabase/server'
import { requireCapability } from '@/lib/permissions/capabilities'
import { lesionInputSchema, lesionUpdateSchema } from './schema'
import type { LesionInputSchema, LesionUpdateSchema } from './schema'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function registrarLesion(input: LesionInputSchema) {
  const auth = await requireCapability('ccbp.salud.write')
  if (!auth.ok) return { ok: false, error: auth.error }

  const parsed = lesionInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { persona_id, tipo_lesion_slug, zona_corporal, gravedad, fecha_inicio, equipo_id, ...rest } = parsed.data
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('personas_lesiones')
    .insert({
      tenant_id: TENANT_ID,
      persona_id,
      tipo_lesion_slug,
      tipo_lesion: rest.tipo_lesion || tipo_lesion_slug,
      zona_corporal,
      gravedad,
      fecha_inicio,
      equipo_id: equipo_id || null,
      restriccion_actividad: rest.restriccion_actividad || null,
      diagnostico_medico: rest.diagnostico_medico || null,
      tratamiento: rest.tratamiento || null,
      descripcion: rest.descripcion || null,
      notas: rest.notas || null,
      recuperada: false,
      activo: true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id }
}

export async function actualizarLesion(id: string, input: LesionUpdateSchema) {
  const parsed = lesionUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('personas_lesiones')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function marcarRecuperada(id: string, fechaAlta?: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('personas_lesiones')
    .update({
      recuperada: true,
      fecha_alta_medica: fechaAlta || new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function softDeleteLesion(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('personas_lesiones')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
