'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { shapeInputSchema, shapeUpdateSchema, type ShapeInput } from './schema'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type Result = { ok: boolean; error?: string; id?: string }

export async function crearShape(input: ShapeInput): Promise<Result> {
  const parsed = shapeInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const d = parsed.data

  const { data, error } = await (supabase as any)
    .from('diagramacion_club')
    .insert({
      tenant_id: TENANT_ID,
      espacio_id: d.espacio_id || null,
      sede_id: d.sede_id || null,
      pos_x: d.pos_x,
      pos_y: d.pos_y,
      ancho: d.ancho,
      alto: d.alto,
      rotacion: d.rotacion,
      forma: d.forma,
      color_fondo: d.color_fondo,
      color_borde: d.color_borde,
      texto_label: d.texto_label || null,
      icono: d.icono || null,
      capa: d.capa,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/club/mapa')
  return { ok: true, id: data?.id }
}

export async function actualizarShape(id: string, input: Partial<ShapeInput>): Promise<Result> {
  const parsed = shapeUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  const d = parsed.data
  if (d.pos_x !== undefined) updateData.pos_x = d.pos_x
  if (d.pos_y !== undefined) updateData.pos_y = d.pos_y
  if (d.ancho !== undefined) updateData.ancho = d.ancho
  if (d.alto !== undefined) updateData.alto = d.alto
  if (d.rotacion !== undefined) updateData.rotacion = d.rotacion
  if (d.forma !== undefined) updateData.forma = d.forma
  if (d.color_fondo !== undefined) updateData.color_fondo = d.color_fondo
  if (d.color_borde !== undefined) updateData.color_borde = d.color_borde
  if (d.texto_label !== undefined) updateData.texto_label = d.texto_label || null
  if (d.icono !== undefined) updateData.icono = d.icono || null
  if (d.espacio_id !== undefined) updateData.espacio_id = d.espacio_id || null
  if (d.sede_id !== undefined) updateData.sede_id = d.sede_id || null
  if (d.capa !== undefined) updateData.capa = d.capa

  const { error } = await (supabase as any)
    .from('diagramacion_club')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/club/mapa')
  return { ok: true }
}

export async function eliminarShape(id: string): Promise<Result> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('diagramacion_club')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/club/mapa')
  return { ok: true }
}
