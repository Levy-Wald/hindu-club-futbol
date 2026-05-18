'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

async function canInscribirEnTorneos(persona_id: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data: atrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'torneos.admin', 'torneos.inscriptor'])
    .eq('activo', true)
  return (atrs && atrs.length > 0) ?? false
}

export type Inscripcion = {
  id: string
  tenant_id: string
  equipo_id: string
  federacion_id: string | null
  torneo_nombre: string
  categoria_externa: string | null
  numero_afiliacion: string | null
  torneo_id: string | null
  activo: boolean
  fecha_alta: string | null
  // Hydrated
  equipo_nombre: string
  federacion_nombre: string | null
  torneo_formal_nombre: string | null
}

export async function listarInscripciones(tenant_id: string): Promise<Inscripcion[]> {
  const supabase = createServiceRoleClient()

  const { data: rows } = await supabase
    .from('equipos_competencias')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (!rows || rows.length === 0) return []

  // Hydrate equipo names
  const equipoIds = [...new Set(rows.map((r) => r.equipo_id))]
  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre')
    .in('id', equipoIds)
  const eqMap: Record<string, string> = {}
  for (const e of equipos ?? []) eqMap[e.id] = e.nombre

  // Hydrate federacion names
  const fedIds = [...new Set(rows.filter((r) => r.federacion_id).map((r) => r.federacion_id!))]
  const fedMap: Record<string, string> = {}
  if (fedIds.length > 0) {
    const { data: feds } = await supabase
      .from('entidades')
      .select('id, nombre')
      .in('id', fedIds)
    for (const f of feds ?? []) fedMap[f.id] = f.nombre
  }

  // Hydrate torneo formal names
  const torneoIds = [...new Set(rows.filter((r) => r.torneo_id).map((r) => r.torneo_id!))]
  const torneoMap: Record<string, string> = {}
  if (torneoIds.length > 0) {
    const { data: torneos } = await supabase
      .from('torneos')
      .select('id, nombre')
      .in('id', torneoIds)
    for (const t of torneos ?? []) torneoMap[t.id] = t.nombre
  }

  return rows.map((r) => ({
    ...r,
    equipo_nombre: eqMap[r.equipo_id] ?? 'Equipo desconocido',
    federacion_nombre: r.federacion_id ? (fedMap[r.federacion_id] ?? null) : null,
    torneo_formal_nombre: r.torneo_id ? (torneoMap[r.torneo_id] ?? null) : null,
  }))
}

export async function inscribirEquipoEnTorneoExternoAction(input: {
  torneo_id: string
  equipo_id: string
  categoria_id?: string
  categoria_externa?: string
  numero_afiliacion?: string
}): Promise<{ ok: true; inscripcion_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canInscribirEnTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso para inscribir equipos en torneos' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Verify torneo is external
  const { data: torneo } = await supabase
    .from('torneos')
    .select('id, nombre, tipo, federacion_id')
    .eq('id', input.torneo_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) return { ok: false, error: 'Torneo no encontrado' }
  if (torneo.tipo !== 'externo') return { ok: false, error: 'Solo se puede inscribir en torneos externos' }

  // Add to torneo_equipos (equipo propio in external torneo)
  const { data: teq, error: errTE } = await supabase
    .from('torneo_equipos')
    .insert({
      tenant_id,
      torneo_id: input.torneo_id,
      categoria_id: input.categoria_id || null,
      equipo_id: input.equipo_id,
    })
    .select('id')
    .single()

  if (errTE) return { ok: false, error: errTE.message }

  // Also register in equipos_competencias (formal relationship)
  const { data: ec, error: errEC } = await supabase
    .from('equipos_competencias')
    .insert({
      tenant_id,
      equipo_id: input.equipo_id,
      federacion_id: torneo.federacion_id,
      torneo_nombre: torneo.nombre,
      torneo_id: input.torneo_id,
      categoria_externa: input.categoria_externa?.trim() || null,
      numero_afiliacion: input.numero_afiliacion?.trim() || null,
    })
    .select('id')
    .single()

  if (errEC) return { ok: false, error: errEC.message }

  return { ok: true, inscripcion_id: ec!.id }
}

export async function eliminarInscripcionAction(input: {
  inscripcion_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canInscribirEnTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('equipos_competencias')
    .update({ activo: false })
    .eq('id', input.inscripcion_id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
