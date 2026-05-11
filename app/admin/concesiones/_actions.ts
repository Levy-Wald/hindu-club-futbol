'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion } from '@/lib/notificaciones/crear'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// -------------------------------------------------------------------
// Auth helper
// -------------------------------------------------------------------

async function getPersonaId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()
  return persona?.id ?? null
}

// ===================================================================
// Concesionarios CRUD
// ===================================================================

export async function listarConcesionarios() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_concesionarios_resumen')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_comercial')

  if (error) return []
  return data ?? []
}

export async function obtenerConcesionario(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_concesionarios_resumen')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

export async function crearConcesionario(input: {
  persona_id?: string
  entidad_id?: string
  nombre_comercial: string
  descripcion?: string
  canon_porcentaje: number
  canon_minimo_mensual?: number
  moneda?: string
  notas?: string
}) {
  const supabase = await createClient()

  if (!input.nombre_comercial.trim()) {
    return formatResult(false, 'El nombre comercial es obligatorio')
  }
  if (!input.persona_id && !input.entidad_id) {
    return formatResult(false, 'Debe seleccionar una persona o entidad titular')
  }

  const { data, error } = await supabase
    .from('concesionarios')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: input.persona_id || null,
      entidad_id: input.entidad_id || null,
      nombre_comercial: input.nombre_comercial.trim(),
      descripcion: input.descripcion?.trim() || null,
      canon_porcentaje: input.canon_porcentaje,
      canon_minimo_mensual: input.canon_minimo_mensual ?? 0,
      moneda: input.moneda || 'ARS',
      notas: input.notas?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear concesionario: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, 'Concesionario creado correctamente', { id: data.id })
}

export async function editarConcesionario(id: string, input: {
  nombre_comercial: string
  descripcion?: string
  canon_porcentaje: number
  canon_minimo_mensual?: number
  moneda?: string
  notas?: string
  activo?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('concesionarios')
    .update({
      nombre_comercial: input.nombre_comercial.trim(),
      descripcion: input.descripcion?.trim() || null,
      canon_porcentaje: input.canon_porcentaje,
      canon_minimo_mensual: input.canon_minimo_mensual ?? 0,
      moneda: input.moneda || 'ARS',
      notas: input.notas?.trim() || null,
      activo: input.activo ?? true,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar concesionario: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  revalidatePath(`/admin/concesiones/${id}`)
  return formatResult(true, 'Concesionario actualizado')
}

export async function darDeBajaConcesionario(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('concesionarios')
    .update({
      activo: false,
      fecha_fin_acuerdo: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al dar de baja: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, 'Concesionario dado de baja')
}

export async function configurarMPCredenciales(id: string, credenciales: {
  access_token?: string
  public_key?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('concesionarios')
    .update({
      mp_credenciales_jsonb: credenciales,
      mp_modo: credenciales.access_token ? 'sandbox' : 'mock',
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al configurar MP: ${error.message}`)
  }

  revalidatePath(`/admin/concesiones/${id}`)
  return formatResult(true, 'Credenciales MP actualizadas')
}

// ===================================================================
// Puntos de venta
// ===================================================================

export async function listarPuntosVenta(concesionarioId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concesion_puntos_venta')
    .select('*, sedes(id, nombre)')
    .eq('concesionario_id', concesionarioId)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (error) return []
  return data ?? []
}

export async function crearPuntoVenta(concesionarioId: string, input: {
  nombre: string
  sede_id?: string
  descripcion?: string
  ubicacion_detalle?: string
}) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const { data, error } = await supabase
    .from('concesion_puntos_venta')
    .insert({
      tenant_id: TENANT_ID,
      concesionario_id: concesionarioId,
      nombre: input.nombre.trim(),
      sede_id: input.sede_id || null,
      descripcion: input.descripcion?.trim() || null,
      ubicacion_detalle: input.ubicacion_detalle?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear punto de venta: ${error.message}`)
  }

  revalidatePath(`/admin/concesiones/${concesionarioId}`)
  return formatResult(true, 'Punto de venta creado', { id: data.id })
}

export async function editarPuntoVenta(id: string, input: {
  nombre: string
  sede_id?: string
  descripcion?: string
  ubicacion_detalle?: string
  activo?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('concesion_puntos_venta')
    .update({
      nombre: input.nombre.trim(),
      sede_id: input.sede_id || null,
      descripcion: input.descripcion?.trim() || null,
      ubicacion_detalle: input.ubicacion_detalle?.trim() || null,
      activo: input.activo ?? true,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar punto de venta: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, 'Punto de venta actualizado')
}

// ===================================================================
// Productos del concesionario
// ===================================================================

export async function listarProductos(concesionarioId: string, filtros?: {
  categoria?: string
  activo?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('concesion_productos')
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (filtros?.categoria) query = query.eq('categoria', filtros.categoria)
  if (filtros?.activo !== undefined) query = query.eq('activo', filtros.activo)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function crearProducto(concesionarioId: string, input: {
  nombre: string
  categoria: string
  subcategoria?: string
  marca?: string
  descripcion?: string
  precio: number
  moneda?: string
  stock_actual?: number
  stock_minimo?: number
  unidad?: string
  foto_url?: string
}) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }
  if (input.precio < 0) {
    return formatResult(false, 'El precio no puede ser negativo')
  }

  const { data, error } = await supabase
    .from('concesion_productos')
    .insert({
      tenant_id: TENANT_ID,
      concesionario_id: concesionarioId,
      nombre: input.nombre.trim(),
      categoria: input.categoria,
      subcategoria: input.subcategoria?.trim() || null,
      marca: input.marca?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      precio: input.precio,
      moneda: input.moneda || 'ARS',
      stock_actual: input.stock_actual ?? 0,
      stock_minimo: input.stock_minimo ?? 0,
      unidad: input.unidad || 'unidad',
      foto_url: input.foto_url || null,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear producto: ${error.message}`)
  }

  revalidatePath(`/admin/concesiones/${concesionarioId}`)
  return formatResult(true, 'Producto creado', { id: data.id })
}

export async function editarProducto(id: string, input: {
  nombre: string
  categoria: string
  subcategoria?: string
  marca?: string
  descripcion?: string
  precio: number
  moneda?: string
  stock_minimo?: number
  unidad?: string
  foto_url?: string
  activo?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('concesion_productos')
    .update({
      nombre: input.nombre.trim(),
      categoria: input.categoria,
      subcategoria: input.subcategoria?.trim() || null,
      marca: input.marca?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      precio: input.precio,
      moneda: input.moneda || 'ARS',
      stock_minimo: input.stock_minimo ?? 0,
      unidad: input.unidad || 'unidad',
      foto_url: input.foto_url || null,
      activo: input.activo ?? true,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar producto: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, 'Producto actualizado')
}

export async function ajustarStock(id: string, cantidadDelta: number, motivo: string) {
  const supabase = await createClient()

  const { data: prod } = await supabase
    .from('concesion_productos')
    .select('stock_actual, stock_minimo, nombre, concesionario_id')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!prod) return formatResult(false, 'Producto no encontrado')

  const nuevoStock = prod.stock_actual + cantidadDelta
  if (nuevoStock < 0) {
    return formatResult(false, 'El stock no puede quedar negativo')
  }

  const { error } = await supabase
    .from('concesion_productos')
    .update({
      stock_actual: nuevoStock,
      metadata: { ultimo_ajuste: { delta: cantidadDelta, motivo, fecha: new Date().toISOString() } },
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al ajustar stock: ${error.message}`)
  }

  // Notificar si stock bajo mínimo
  if (nuevoStock <= (prod.stock_minimo ?? 0) && prod.stock_minimo && prod.stock_minimo > 0) {
    const { data: conc } = await supabase
      .from('concesionarios')
      .select('persona_id')
      .eq('id', prod.concesionario_id)
      .single()

    if (conc?.persona_id) {
      crearNotificacion({
        tenant_id: TENANT_ID,
        destinatario_persona_id: conc.persona_id,
        tipo: 'concesion_stock_minimo',
        titulo: `Stock bajo: ${prod.nombre}`,
        mensaje: `El producto "${prod.nombre}" tiene stock ${nuevoStock} (mínimo: ${prod.stock_minimo}).`,
        prioridad: 'media',
        origen_tabla: 'concesion_productos',
        origen_registro_id: id,
        origen_evento: 'ajuste_stock',
      }).catch(() => {})
    }
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, `Stock ajustado a ${nuevoStock}`)
}

// ===================================================================
// Ventas
// ===================================================================

export async function registrarVenta(input: {
  concesionario_id: string
  punto_venta_id?: string
  items: Array<{ producto_id: string; cantidad: number; precio_unitario: number }>
  metodo_pago: string
  comprador_persona_id?: string
  comprador_nombre_libre?: string
  notas?: string
}) {
  const supabase = await createClient()
  const personaId = await getPersonaId()

  if (!input.items.length) {
    return formatResult(false, 'Debe agregar al menos un producto')
  }

  const { data, error } = await supabase.rpc('fn_registrar_venta_concesion', {
    p_concesionario_id: input.concesionario_id,
    p_punto_venta_id: input.punto_venta_id || null,
    p_items: input.items,
    p_metodo_pago: input.metodo_pago,
    p_comprador_persona_id: input.comprador_persona_id || null,
    p_comprador_nombre_libre: input.comprador_nombre_libre || null,
    p_registrada_por_persona_id: personaId,
    p_notas: input.notas || null,
  })

  if (error) {
    return formatResult(false, `Error al registrar venta: ${error.message}`)
  }

  const rows = data as Array<{
    venta_id: string
    monto_total: number
    canon_monto: number
    mp_link_pago: string | null
  }>
  const result = rows[0]

  if (!result) {
    return formatResult(false, 'Error inesperado: sin resultado de venta')
  }

  // Descontar stock de cada item
  for (const item of input.items) {
    await ajustarStock(item.producto_id, -item.cantidad, 'Venta registrada')
  }

  revalidatePath(`/admin/concesiones/${input.concesionario_id}`)
  return formatResult(true, 'Venta registrada correctamente', result)
}

export async function anularVenta(ventaId: string, motivo: string) {
  const supabase = await createClient()
  const personaId = await getPersonaId()

  const { data: venta } = await supabase
    .from('concesion_ventas')
    .select('id, estado, concesionario_id')
    .eq('id', ventaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!venta) return formatResult(false, 'Venta no encontrada')
  if (venta.estado === 'anulada') return formatResult(false, 'La venta ya está anulada')

  const { error } = await supabase
    .from('concesion_ventas')
    .update({
      estado: 'anulada',
      anulada_at: new Date().toISOString(),
      anulada_motivo: motivo,
      anulada_por_persona_id: personaId,
    })
    .eq('id', ventaId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al anular venta: ${error.message}`)
  }

  // Restaurar stock
  const { data: items } = await supabase
    .from('concesion_venta_items')
    .select('producto_id, cantidad')
    .eq('venta_id', ventaId)

  for (const item of items ?? []) {
    await ajustarStock(item.producto_id, item.cantidad, 'Anulación de venta')
  }

  revalidatePath(`/admin/concesiones/${venta.concesionario_id}`)
  return formatResult(true, 'Venta anulada correctamente')
}

export async function listarVentas(filtros?: {
  concesionario_id?: string
  estado?: string
  punto_venta_id?: string
  desde?: string
  hasta?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('concesion_ventas')
    .select(`
      *,
      concesionarios(nombre_comercial),
      concesion_puntos_venta(nombre),
      comprador:personas!comprador_persona_id(nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(filtros?.limit ?? 200)

  if (filtros?.concesionario_id) query = query.eq('concesionario_id', filtros.concesionario_id)
  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.punto_venta_id) query = query.eq('punto_venta_id', filtros.punto_venta_id)
  if (filtros?.desde) query = query.gte('created_at', filtros.desde)
  if (filtros?.hasta) query = query.lte('created_at', filtros.hasta)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function obtenerVenta(ventaId: string) {
  const supabase = await createClient()

  const { data: venta } = await supabase
    .from('concesion_ventas')
    .select(`
      *,
      concesionarios(nombre_comercial),
      concesion_puntos_venta(nombre),
      comprador:personas!comprador_persona_id(nombre, apellido)
    `)
    .eq('id', ventaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!venta) return null

  const { data: items } = await supabase
    .from('concesion_venta_items')
    .select('*, concesion_productos(nombre, categoria)')
    .eq('venta_id', ventaId)

  return { ...venta, items: items ?? [] }
}

// ===================================================================
// Canon
// ===================================================================

export async function calcularCanonPeriodo(concesionarioId: string, periodo: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_calcular_canon_concesion', {
    p_concesionario_id: concesionarioId,
    p_periodo: periodo,
  })

  if (error) {
    return formatResult(false, `Error al calcular canon: ${error.message}`)
  }

  // Notificar admin
  crearNotificacion({
    tenant_id: TENANT_ID,
    destinatario_persona_id: '3d2d5902-9c10-4154-8086-316b0fbe081e', // admin (Yair)
    tipo: 'concesion_canon_calculado',
    titulo: `Canon calculado: ${periodo}`,
    mensaje: `Se calculó el canon del período ${periodo} para un concesionario.`,
    prioridad: 'media',
    origen_tabla: 'concesion_canones',
    origen_registro_id: data as string,
    origen_evento: 'calcular_canon',
  }).catch(() => {})

  revalidatePath(`/admin/concesiones/${concesionarioId}`)
  return formatResult(true, 'Canon calculado correctamente', { canon_id: data })
}

export async function listarCanones(concesionarioId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concesion_canones')
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .eq('tenant_id', TENANT_ID)
    .order('periodo', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function cobrarCanon(canonId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_cobrar_canon_concesion', {
    p_canon_id: canonId,
  })

  if (error) {
    return formatResult(false, `Error al cobrar canon: ${error.message}`)
  }

  const rows = data as Array<{ canon_id: string; estado_final: string }>
  revalidatePath('/admin/concesiones')
  return formatResult(true, 'Canon marcado como cobrado', rows[0])
}

export async function reportarVentasConcesionario(canonId: string, montoReportado: number) {
  const supabase = await createClient()

  const { data: canon } = await supabase
    .from('concesion_canones')
    .select('canon_efectivo')
    .eq('id', canonId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!canon) return formatResult(false, 'Canon no encontrado')

  const diferencia = canon.canon_efectivo - montoReportado

  const { error } = await supabase
    .from('concesion_canones')
    .update({
      reportado_por_concesionario: montoReportado,
      diferencia,
      estado: Math.abs(diferencia) < 0.01 ? 'conciliado' : 'disputado',
      fecha_conciliacion: Math.abs(diferencia) < 0.01 ? new Date().toISOString() : null,
    })
    .eq('id', canonId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al reportar: ${error.message}`)
  }

  revalidatePath('/admin/concesiones')
  return formatResult(true, Math.abs(diferencia) < 0.01 ? 'Canon conciliado' : `Diferencia detectada: $${diferencia.toFixed(2)}`)
}

// ===================================================================
// Reportes
// ===================================================================

export async function reporteVentasMensuales(concesionarioId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_concesion_ventas_mensuales')
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .eq('tenant_id', TENANT_ID)
    .order('periodo', { ascending: false })
    .limit(24)

  if (error) return []
  return data ?? []
}

export async function fetchSedes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sedes')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (error) return []
  return data ?? []
}
