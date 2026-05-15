'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AplicaA, TipoDato } from './tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type ActionResult = { ok: boolean; message: string; id?: string }

function success(message = 'OK', id?: string): ActionResult {
  return { ok: true, message, id }
}

function fail(message: string): ActionResult {
  return { ok: false, message }
}

// =============================================================================
// Definiciones
// =============================================================================

export async function crearDefinicion(input: {
  slug: string
  nombre: string
  descripcion?: string
  aplica_a: AplicaA
  obligatorio?: boolean
  tipo_dato: TipoDato
  opciones?: string[]
  validacion?: Record<string, unknown>
  valor_default?: string
  orden?: number
  visible_en_listado?: boolean
  visible_en_filtro?: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('atributos_custom_definicion')
    .insert({
      tenant_id: TENANT_ID,
      slug: input.slug,
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      aplica_a: input.aplica_a,
      obligatorio: input.obligatorio ?? false,
      tipo_dato: input.tipo_dato,
      opciones: input.opciones && input.opciones.length > 0 ? input.opciones : null,
      validacion: input.validacion || null,
      valor_default: input.valor_default || null,
      orden: input.orden ?? 100,
      visible_en_listado: input.visible_en_listado ?? false,
      visible_en_filtro: input.visible_en_filtro ?? false,
    })
    .select('id')
    .single()

  if (error) return fail(error.message)

  revalidatePath('/admin/configuracion/atributos-custom')
  return success('Definición creada', data.id)
}

export async function actualizarDefinicion(id: string, input: {
  nombre?: string
  descripcion?: string | null
  obligatorio?: boolean
  opciones?: string[]
  validacion?: Record<string, unknown> | null
  valor_default?: string | null
  orden?: number
  visible_en_listado?: boolean
  visible_en_filtro?: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (input.nombre !== undefined) updateData.nombre = input.nombre
  if (input.descripcion !== undefined) updateData.descripcion = input.descripcion
  if (input.obligatorio !== undefined) updateData.obligatorio = input.obligatorio
  if (input.opciones !== undefined) updateData.opciones = input.opciones.length > 0 ? input.opciones : null
  if (input.validacion !== undefined) updateData.validacion = input.validacion
  if (input.valor_default !== undefined) updateData.valor_default = input.valor_default
  if (input.orden !== undefined) updateData.orden = input.orden
  if (input.visible_en_listado !== undefined) updateData.visible_en_listado = input.visible_en_listado
  if (input.visible_en_filtro !== undefined) updateData.visible_en_filtro = input.visible_en_filtro

  const { error } = await supabase
    .from('atributos_custom_definicion')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/configuracion/atributos-custom')
  return success('Definición actualizada')
}

export async function softDeleteDefinicion(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('atributos_custom_definicion')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/configuracion/atributos-custom')
  return success('Definición eliminada')
}

// =============================================================================
// Valores
// =============================================================================

export async function guardarValor(input: {
  definicion_id: string
  entidad_tipo: AplicaA
  entidad_id: string
  valor?: string | null
  valor_jsonb?: unknown | null
}): Promise<ActionResult> {
  const supabase = await createClient()

  // Check if value already exists
  const { data: existing } = await supabase
    .from('atributos_custom_valores')
    .select('id')
    .eq('definicion_id', input.definicion_id)
    .eq('entidad_tipo', input.entidad_tipo)
    .eq('entidad_id', input.entidad_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('atributos_custom_valores')
      .update({
        valor: input.valor ?? null,
        valor_jsonb: input.valor_jsonb ?? null,
      })
      .eq('id', existing.id)

    if (error) return fail(error.message)
  } else {
    // Insert
    const { error } = await supabase
      .from('atributos_custom_valores')
      .insert({
        tenant_id: TENANT_ID,
        definicion_id: input.definicion_id,
        entidad_tipo: input.entidad_tipo,
        entidad_id: input.entidad_id,
        valor: input.valor ?? null,
        valor_jsonb: input.valor_jsonb ?? null,
      })

    if (error) return fail(error.message)
  }

  return success('Valor guardado')
}

export async function guardarValoresBatch(
  entidadTipo: AplicaA,
  entidadId: string,
  valores: { definicion_id: string; valor?: string | null; valor_jsonb?: unknown | null }[]
): Promise<ActionResult> {
  for (const v of valores) {
    const result = await guardarValor({
      definicion_id: v.definicion_id,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      valor: v.valor,
      valor_jsonb: v.valor_jsonb,
    })
    if (!result.ok) return result
  }

  revalidatePath(`/admin/personas/${entidadId}`)
  revalidatePath(`/admin/entidades/${entidadId}`)
  return success('Valores guardados')
}

// =============================================================================
// Vinculos cross (persona-entidad, entidad-entidad)
// =============================================================================

export async function crearVinculoCross(input: {
  origen_tipo: 'persona' | 'entidad'
  origen_id: string
  destino_tipo: 'persona' | 'entidad'
  destino_id: string
  tipo_vinculo: string
  notas?: string
  fecha_inicio?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vinculos_cross')
    .insert({
      tenant_id: TENANT_ID,
      origen_tipo: input.origen_tipo,
      origen_id: input.origen_id,
      destino_tipo: input.destino_tipo,
      destino_id: input.destino_id,
      tipo_vinculo: input.tipo_vinculo,
      notas: input.notas || null,
      fecha_inicio: input.fecha_inicio || null,
    })

  if (error) return fail(error.message)

  revalidatePath(`/admin/personas/${input.origen_id}`)
  revalidatePath(`/admin/personas/${input.destino_id}`)
  revalidatePath(`/admin/entidades/${input.origen_id}`)
  revalidatePath(`/admin/entidades/${input.destino_id}`)
  return success('Vínculo creado')
}

export async function desactivarVinculoCross(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vinculos_cross')
    .update({ activo: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/personas')
  revalidatePath('/admin/entidades')
  return success('Vínculo eliminado')
}
