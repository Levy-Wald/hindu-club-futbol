'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { evaluacionInputSchema, evaluacionUpdateSchema } from './schema'
import type { EvaluacionInput, EvaluacionUpdate } from './schema'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function crearEvaluacion(input: EvaluacionInput) {
  const parsed = evaluacionInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { ficha_id, ...rest } = parsed.data
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('scouting_evaluaciones')
    .insert({
      tenant_id: TENANT_ID,
      ficha_id,
      scout_persona_id: rest.scout_persona_id || null,
      fecha_evaluacion: rest.fecha_evaluacion,
      contexto: rest.contexto || null,
      control_balon: rest.control_balon ?? null,
      pase: rest.pase ?? null,
      definicion: rest.definicion ?? null,
      uno_vs_uno: rest.uno_vs_uno ?? null,
      velocidad: rest.velocidad ?? null,
      resistencia: rest.resistencia ?? null,
      fuerza: rest.fuerza ?? null,
      mentalidad: rest.mentalidad ?? null,
      competitividad: rest.competitividad ?? null,
      vision_juego: rest.vision_juego ?? null,
      posicionamiento: rest.posicionamiento ?? null,
      fortalezas: rest.fortalezas || null,
      debilidades: rest.debilidades || null,
      observaciones_generales: rest.observaciones_generales || null,
      recomendacion: rest.recomendacion || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/operaciones/scouting/${ficha_id}`)
  return { ok: true, id: data.id }
}

export async function actualizarEvaluacion(id: string, fichaId: string, input: EvaluacionUpdate) {
  const parsed = evaluacionUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('scouting_evaluaciones')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/operaciones/scouting/${fichaId}`)
  return { ok: true }
}

export async function softDeleteEvaluacion(id: string, fichaId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('scouting_evaluaciones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/operaciones/scouting/${fichaId}`)
  return { ok: true }
}

export async function promoverFichaAPersona(fichaId: string) {
  const supabase = await createClient()

  // Get ficha data
  const { data: ficha, error: fetchErr } = await supabase
    .from('scouting_fichas')
    .select('*')
    .eq('id', fichaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !ficha) return { ok: false, error: 'Ficha no encontrada' }
  if (ficha.persona_id) return { ok: false, error: 'Esta ficha ya fue promovida a persona' }

  // Create persona
  const { data: persona, error: insertErr } = await supabase
    .from('personas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: ficha.nombre,
      apellido: ficha.apellido,
      fecha_nacimiento: ficha.fecha_nacimiento || null,
      estado: 'activo',
    })
    .select('id')
    .single()

  if (insertErr) return { ok: false, error: insertErr.message }

  // Link ficha to persona
  const { error: linkErr } = await supabase
    .from('scouting_fichas')
    .update({ persona_id: persona.id, estado: 'incorporado' })
    .eq('id', fichaId)
    .eq('tenant_id', TENANT_ID)

  if (linkErr) return { ok: false, error: linkErr.message }

  revalidatePath(`/admin/operaciones/scouting/${fichaId}`)
  revalidatePath('/admin/personas')
  return { ok: true, persona_id: persona.id }
}
