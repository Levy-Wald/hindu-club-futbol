'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canEditarPlan } from './permisos'
import type { Intensidad } from './types'

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return persona
}

export async function crearOActualizarPlanAction(input: {
  evento_id: string
  objetivo?: string | null
  nivel_intensidad?: Intensidad | null
  notas_dt?: string | null
}): Promise<{ ok: true; plan_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarPlan(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  // Verify event is tipo entrenamiento and belongs to tenant
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, tipo_evento_slug')
    .eq('id', input.evento_id)
    .eq('tenant_id', persona.tenant_id)
    .eq('activo', true)
    .single()

  if (!evento) return { ok: false, error: 'Evento no encontrado' }
  if (evento.tipo_evento_slug !== 'entrenamiento') {
    return { ok: false, error: 'El evento no es de tipo entrenamiento' }
  }

  // Upsert on evento_id UNIQUE
  const { data: plan, error } = await supabase
    .from('entrenamiento_planes')
    .upsert({
      tenant_id: persona.tenant_id,
      evento_id: input.evento_id,
      objetivo: input.objetivo ?? null,
      nivel_intensidad: input.nivel_intensidad ?? null,
      notas_dt: input.notas_dt ?? null,
      creado_por_persona_id: persona.id,
    }, { onConflict: 'evento_id' })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, plan_id: plan.id }
}

export async function agregarBloqueAction(input: {
  plan_id: string
  evento_id: string
  ejercicio_id?: string | null
  nombre_personalizado?: string | null
  duracion_min?: number | null
  repeticiones?: number | null
  series?: number | null
  intensidad_override?: Intensidad | null
  notas_bloque?: string | null
}): Promise<{ ok: true; bloque_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarPlan(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  // Get max orden
  const { data: maxRow } = await supabase
    .from('entrenamiento_plan_bloques')
    .select('orden')
    .eq('plan_id', input.plan_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nuevoOrden = (maxRow?.orden ?? 0) + 1

  const { data: bloque, error } = await supabase
    .from('entrenamiento_plan_bloques')
    .insert({
      tenant_id: persona.tenant_id,
      plan_id: input.plan_id,
      orden: nuevoOrden,
      ejercicio_id: input.ejercicio_id ?? null,
      nombre_personalizado: input.nombre_personalizado ?? null,
      duracion_min: input.duracion_min ?? null,
      repeticiones: input.repeticiones ?? null,
      series: input.series ?? null,
      intensidad_override: input.intensidad_override ?? null,
      notas_bloque: input.notas_bloque ?? null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, bloque_id: bloque.id }
}

export async function actualizarBloqueAction(input: {
  bloque_id: string
  evento_id: string
  duracion_min?: number | null
  repeticiones?: number | null
  series?: number | null
  intensidad_override?: Intensidad | null
  notas_bloque?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarPlan(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('entrenamiento_plan_bloques')
    .update({
      duracion_min: input.duracion_min,
      repeticiones: input.repeticiones,
      series: input.series,
      intensidad_override: input.intensidad_override,
      notas_bloque: input.notas_bloque,
    })
    .eq('id', input.bloque_id)
    .eq('tenant_id', persona.tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function eliminarBloqueAction(input: {
  bloque_id: string
  evento_id: string
  plan_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarPlan(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('entrenamiento_plan_bloques')
    .delete()
    .eq('id', input.bloque_id)
    .eq('tenant_id', persona.tenant_id)

  if (error) return { ok: false, error: error.message }

  // Re-numerar orden
  const { data: restantes } = await supabase
    .from('entrenamiento_plan_bloques')
    .select('id')
    .eq('plan_id', input.plan_id)
    .order('orden', { ascending: true })

  if (restantes) {
    for (let i = 0; i < restantes.length; i++) {
      await supabase
        .from('entrenamiento_plan_bloques')
        .update({ orden: i + 1 })
        .eq('id', restantes[i].id)
    }
  }

  return { ok: true }
}

export async function reordenarBloquesAction(input: {
  plan_id: string
  evento_id: string
  orden: Array<{ id: string; orden: number }>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarPlan(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  for (const item of input.orden) {
    const { error } = await supabase
      .from('entrenamiento_plan_bloques')
      .update({ orden: item.orden })
      .eq('id', item.id)
      .eq('plan_id', input.plan_id)
      .eq('tenant_id', persona.tenant_id)

    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}
