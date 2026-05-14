'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'

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

const TipoMovimientoEnum = z.enum(['entrada', 'salida', 'transferencia', 'ajuste'])

const MovimientoSchema = z.object({
  producto_id: z.string().uuid(),
  variante_id: z.string().uuid().nullable(),
  tipo: TipoMovimientoEnum,
  cantidad: z.number().positive(),
  espacio_origen_id: z.string().uuid().nullable(),
  espacio_destino_id: z.string().uuid().nullable(),
  motivo: z.string().nullable(),
  documento_ref: z.string().nullable().optional(),
})

type ActionResult = { ok: true } | { ok: false; error: string }

export async function aplicarMovimientoStockAction(
  input: z.infer<typeof MovimientoSchema>
): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = MovimientoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  const data = parsed.data

  // Validate tipo + espacio combinations
  if (data.tipo === 'entrada' && !data.espacio_destino_id) {
    return { ok: false, error: 'Entrada requiere espacio destino' }
  }
  if (data.tipo === 'salida' && !data.espacio_origen_id) {
    return { ok: false, error: 'Salida requiere espacio origen' }
  }
  if (data.tipo === 'transferencia') {
    if (!data.espacio_origen_id || !data.espacio_destino_id) {
      return { ok: false, error: 'Transferencia requiere origen y destino' }
    }
    if (data.espacio_origen_id === data.espacio_destino_id) {
      return { ok: false, error: 'Origen y destino deben ser distintos' }
    }
  }
  if (data.tipo === 'ajuste' && !data.espacio_destino_id) {
    return { ok: false, error: 'Ajuste requiere espacio' }
  }

  const supabase = createServiceRoleClient()

  // Pre-check stock for salida/transferencia
  if (data.tipo === 'salida' || data.tipo === 'transferencia') {
    let stockQuery = supabase
      .from('producto_stock_espacio')
      .select('cantidad')
      .eq('producto_id', data.producto_id)
      .eq('espacio_id', data.espacio_origen_id!)

    if (data.variante_id) {
      stockQuery = stockQuery.eq('variante_id', data.variante_id)
    } else {
      stockQuery = stockQuery.is('variante_id', null)
    }

    const { data: stockCheck } = await stockQuery.maybeSingle()
    const currentStock = stockCheck?.cantidad ?? 0

    if (currentStock < data.cantidad) {
      return { ok: false, error: `Stock insuficiente. Disponible: ${currentStock}, solicitado: ${data.cantidad}` }
    }
  }

  // No RPC exists yet — use manual queries
  return await aplicarMovimientoManual(supabase, data, persona.id)
}

async function aplicarMovimientoManual(
  supabase: ReturnType<typeof createServiceRoleClient>,
  data: z.infer<typeof MovimientoSchema>,
  personaId: string
): Promise<ActionResult> {
  // 1. Insert movimiento record
  const { error: movError } = await supabase
    .from('producto_movimientos_stock')
    .insert({
      producto_id: data.producto_id,
      variante_id: data.variante_id,
      tipo: data.tipo,
      cantidad: data.cantidad,
      espacio_origen_id: data.espacio_origen_id,
      espacio_destino_id: data.espacio_destino_id,
      motivo: data.motivo,
      documento_ref: data.documento_ref ?? null,
      persona_id: personaId,
    })
  if (movError) return { ok: false, error: movError.message }

  // 2. Update stock records
  // For salida/transferencia: decrease origen
  if (data.espacio_origen_id && (data.tipo === 'salida' || data.tipo === 'transferencia')) {
    const res = await upsertStock(supabase, data.producto_id, data.variante_id, data.espacio_origen_id, -data.cantidad)
    if (!res.ok) return res
  }

  // For entrada/transferencia: increase destino
  if (data.espacio_destino_id && (data.tipo === 'entrada' || data.tipo === 'transferencia')) {
    const res = await upsertStock(supabase, data.producto_id, data.variante_id, data.espacio_destino_id, data.cantidad)
    if (!res.ok) return res
  }

  // For ajuste: set absolute value (use espacio_destino_id)
  if (data.tipo === 'ajuste' && data.espacio_destino_id) {
    const res = await setStock(supabase, data.producto_id, data.variante_id, data.espacio_destino_id, data.cantidad)
    if (!res.ok) return res
  }

  revalidatePath(`/admin/productos/${data.producto_id}`)
  revalidatePath('/admin/productos/movimientos')
  return { ok: true }
}

async function upsertStock(
  supabase: ReturnType<typeof createServiceRoleClient>,
  productoId: string,
  varianteId: string | null,
  espacioId: string,
  delta: number
): Promise<ActionResult> {
  // Try to find existing record
  let query = supabase
    .from('producto_stock_espacio')
    .select('id, cantidad')
    .eq('producto_id', productoId)
    .eq('espacio_id', espacioId)

  if (varianteId) {
    query = query.eq('variante_id', varianteId)
  } else {
    query = query.is('variante_id', null)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    const newQty = existing.cantidad + delta
    const { error } = await supabase
      .from('producto_stock_espacio')
      .update({ cantidad: newQty })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    if (delta < 0) return { ok: false, error: 'No hay stock para decrementar' }
    const { error } = await supabase
      .from('producto_stock_espacio')
      .insert({
        producto_id: productoId,
        variante_id: varianteId,
        espacio_id: espacioId,
        cantidad: delta,
      })
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}

async function setStock(
  supabase: ReturnType<typeof createServiceRoleClient>,
  productoId: string,
  varianteId: string | null,
  espacioId: string,
  cantidad: number
): Promise<ActionResult> {
  let query = supabase
    .from('producto_stock_espacio')
    .select('id')
    .eq('producto_id', productoId)
    .eq('espacio_id', espacioId)

  if (varianteId) {
    query = query.eq('variante_id', varianteId)
  } else {
    query = query.is('variante_id', null)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('producto_stock_espacio')
      .update({ cantidad })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('producto_stock_espacio')
      .insert({
        producto_id: productoId,
        variante_id: varianteId,
        espacio_id: espacioId,
        cantidad,
      })
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}
