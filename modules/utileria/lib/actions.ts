'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { crearNotificacion, crearNotificacionMasiva } from '@/modules/notificaciones/lib/crear'


function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

async function requireStaff() {
  const p = await obtenerPermisosUtileria()
  if (!p.es_staff_utileria) throw new Error('Sin permiso de staff utilería')
  return p
}

// -------------------------------------------------------------------
// Items
// -------------------------------------------------------------------

import { CATEGORIAS } from './constants'
import { TENANT_ID } from '@/lib/tenant'

export async function listarItems(filtros?: {
  categoria?: string
  equipo_id?: string
  estado?: string
  busqueda?: string
  solo_disponibles?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('utileria_items')
    .select('*, equipos!equipo_id(id, nombre)')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
    .limit(300)

  if (filtros?.categoria) query = query.eq('categoria', filtros.categoria)
  if (filtros?.equipo_id) query = query.eq('equipo_id', filtros.equipo_id)
  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.solo_disponibles) query = query.eq('estado', 'disponible').gt('cantidad_disponible', 0)
  if (filtros?.busqueda) query = query.or(`nombre.ilike.%${filtros.busqueda}%,marca.ilike.%${filtros.busqueda}%,subcategoria.ilike.%${filtros.busqueda}%`)

  const { data, error } = await query
  if (error) return formatResult(false, error.message)
  return formatResult(true, 'OK', data)
}

export async function crearItem(input: {
  nombre: string
  categoria: string
  subcategoria?: string
  marca?: string
  modelo?: string
  color?: string
  talle?: string
  cantidad_total: number
  es_unico: boolean
  numero_serie?: string
  costo_reposicion: number
  equipo_id?: string
  es_consumible: boolean
  ubicacion_vestuario?: string
  notas?: string
}) {
  await requireStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('utileria_items')
    .insert({
      tenant_id: TENANT_ID,
      ...input,
      cantidad_disponible: input.cantidad_total,
    })
    .select('id')
    .single()

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Item creado', data)
}

export async function editarItem(id: string, input: Record<string, unknown>) {
  await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('utileria_items')
    .update(input)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Item actualizado')
}

export async function darDeBajaItem(id: string) {
  await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('utileria_items')
    .update({ activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Item dado de baja')
}

// -------------------------------------------------------------------
// Kits
// -------------------------------------------------------------------

export async function listarKitsPorEquipo(equipoId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('utileria_kits')
    .select('*, equipos!equipo_id(id, nombre), utileria_kit_items(id, item_id, cantidad, obligatorio, utileria_items(id, nombre, categoria))')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (equipoId) query = query.eq('equipo_id', equipoId)

  const { data, error } = await query
  if (error) return formatResult(false, error.message)
  return formatResult(true, 'OK', data)
}

export async function crearKit(input: {
  equipo_id: string
  nombre: string
  tipo: string
  descripcion?: string
}) {
  const p = await obtenerPermisosUtileria()
  if (!p.es_staff_utileria && !p.equipos_donde_es_responsable.includes(input.equipo_id)) {
    return formatResult(false, 'Sin permiso para este equipo')
  }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('utileria_kits')
    .insert({ tenant_id: TENANT_ID, ...input })
    .select('id')
    .single()

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Kit creado', data)
}

export async function agregarItemAKit(kitId: string, itemId: string, cantidad: number) {
  await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('utileria_kit_items')
    .upsert({
      tenant_id: TENANT_ID,
      kit_id: kitId,
      item_id: itemId,
      cantidad,
    }, { onConflict: 'kit_id,item_id' })

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Item agregado al kit')
}

export async function removerItemDeKit(kitId: string, itemId: string) {
  await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('utileria_kit_items')
    .delete()
    .eq('kit_id', kitId)
    .eq('item_id', itemId)

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Item removido del kit')
}

// -------------------------------------------------------------------
// Solicitudes
// -------------------------------------------------------------------

export async function listarSolicitudes(filtros?: {
  estado?: string
  equipo_id?: string
  busqueda?: string
}) {
  const p = await obtenerPermisosUtileria()
  const supabase = await createClient()

  let query = supabase
    .from('utileria_solicitudes')
    .select(`*,
      equipos!equipo_id(id, nombre),
      solicitante:personas!solicitada_por_persona_id(id, nombre, apellido),
      utileria_solicitud_items(id, item_id, cantidad_solicitada, cantidad_entregada, cantidad_devuelta, cantidad_no_devuelta,
        utileria_items(id, nombre, categoria))
    `)
    .eq('tenant_id', TENANT_ID)
    .order('fecha_evento', { ascending: false })
    .limit(100)

  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.equipo_id) query = query.eq('equipo_id', filtros.equipo_id)

  // Non-staff only see their equipos
  if (!p.es_staff_utileria && p.equipos_donde_es_responsable.length > 0) {
    query = query.in('equipo_id', p.equipos_donde_es_responsable)
  }

  const { data, error } = await query
  if (error) return formatResult(false, error.message)
  return formatResult(true, 'OK', data)
}

export async function crearSolicitud(input: {
  equipo_id: string
  descripcion_evento: string
  fecha_evento: string
  items: { item_id: string; cantidad: number }[]
  kit_base_id?: string
  notas_solicitud?: string
}) {
  const p = await obtenerPermisosUtileria()
  if (!p.es_staff_utileria && !p.equipos_donde_es_responsable.includes(input.equipo_id)) {
    return formatResult(false, 'Sin permiso para este equipo')
  }
  if (!p.persona_id) return formatResult(false, 'Sin persona asociada')
  const supabase = await createClient()

  // Snapshot del plantel actual del equipo
  const { data: plantelData } = await supabase
    .from('personas_equipos')
    .select('persona_id')
    .eq('equipo_id', input.equipo_id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const plantel = (plantelData ?? []).map(pe => pe.persona_id)
  if (plantel.length === 0) return formatResult(false, 'El equipo no tiene plantel activo')

  // Create solicitud
  const { data: sol, error: solErr } = await supabase
    .from('utileria_solicitudes')
    .insert({
      tenant_id: TENANT_ID,
      equipo_id: input.equipo_id,
      descripcion_evento: input.descripcion_evento,
      fecha_evento: input.fecha_evento,
      kit_base_id: input.kit_base_id || null,
      plantel_snapshot: plantel,
      solicitada_por_persona_id: p.persona_id,
      notas_solicitud: input.notas_solicitud || null,
    })
    .select('id')
    .single()

  if (solErr) return formatResult(false, solErr.message)

  // Insert items
  const itemRows = input.items.map(i => ({
    tenant_id: TENANT_ID,
    solicitud_id: sol.id,
    item_id: i.item_id,
    cantidad_solicitada: i.cantidad,
  }))

  const { error: itemsErr } = await supabase
    .from('utileria_solicitud_items')
    .insert(itemRows)

  if (itemsErr) return formatResult(false, itemsErr.message)

  // Notify staff_utileria
  const { data: staffUtileria } = await supabase
    .from('personas_atributos')
    .select('persona_id')
    .eq('tenant_id', TENANT_ID)
    .eq('atributo_slug', 'staff_utileria')
    .eq('activo', true)
  const staffIds = (staffUtileria ?? []).map(s => s.persona_id)
  if (staffIds.length > 0) {
    crearNotificacionMasiva(staffIds, {
      tenant_id: TENANT_ID,
      tipo: 'utileria_solicitud_pendiente',
      titulo: `Solicitud nueva: ${input.descripcion_evento}`,
      mensaje: `Nueva solicitud de utilería para ${input.descripcion_evento} (${input.fecha_evento}).`,
      link_accion: '/admin/utileria/solicitudes',
      origen_tabla: 'utileria_solicitudes',
      origen_registro_id: sol.id,
    }).catch(() => {})
  }

  revalidatePath('/admin/utileria')
  return formatResult(true, 'Solicitud creada', { id: sol.id })
}

export async function marcarComoPreparada(solicitudId: string, items: { item_id: string; cantidad: number }[]) {
  await requireStaff()
  const supabase = await createClient()
  const p = await obtenerPermisosUtileria()

  for (const item of items) {
    await supabase
      .from('utileria_solicitud_items')
      .update({ cantidad_preparada: item.cantidad })
      .eq('solicitud_id', solicitudId)
      .eq('item_id', item.item_id)
  }

  await supabase
    .from('utileria_solicitudes')
    .update({
      estado: 'preparada',
      preparada_por_persona_id: p.persona_id,
      fecha_preparada: new Date().toISOString(),
    })
    .eq('id', solicitudId)

  // Notify requester
  const { data: sol } = await supabase
    .from('utileria_solicitudes')
    .select('solicitada_por_persona_id, descripcion_evento')
    .eq('id', solicitudId)
    .single()
  if (sol?.solicitada_por_persona_id) {
    crearNotificacion({
      tenant_id: TENANT_ID,
      destinatario_persona_id: sol.solicitada_por_persona_id,
      tipo: 'utileria_solicitud_preparada',
      titulo: 'Utilería lista para retirar',
      mensaje: `Tu solicitud para ${sol.descripcion_evento} está preparada.`,
      link_accion: '/admin/utileria/solicitudes',
      origen_tabla: 'utileria_solicitudes',
      origen_registro_id: solicitudId,
    }).catch(() => {})
  }

  revalidatePath('/admin/utileria')
  return formatResult(true, 'Solicitud preparada')
}

export async function registrarEntrega(solicitudId: string, retiradaPorPersonaId: string, items: { item_id: string; cantidad: number }[]) {
  await requireStaff()
  const supabase = await createClient()
  const p = await obtenerPermisosUtileria()

  for (const item of items) {
    await supabase
      .from('utileria_solicitud_items')
      .update({ cantidad_entregada: item.cantidad })
      .eq('solicitud_id', solicitudId)
      .eq('item_id', item.item_id)
  }

  const fechaEntrega = new Date()
  const fechaDevEsperada = new Date(fechaEntrega)
  fechaDevEsperada.setDate(fechaDevEsperada.getDate() + 7)

  await supabase
    .from('utileria_solicitudes')
    .update({
      estado: 'entregada',
      entregada_por_persona_id: p.persona_id,
      retirada_por_persona_id: retiradaPorPersonaId,
      fecha_entregada: fechaEntrega.toISOString(),
      fecha_devolucion_esperada: fechaDevEsperada.toISOString(),
    })
    .eq('id', solicitudId)

  revalidatePath('/admin/utileria')
  return formatResult(true, 'Entrega registrada')
}

export async function registrarDevolucion(solicitudId: string, items: { item_id: string; cantidad_devuelta: number; cantidad_dañada?: number }[]) {
  await requireStaff()
  const supabase = await createClient()

  for (const item of items) {
    await supabase
      .from('utileria_solicitud_items')
      .update({
        cantidad_devuelta: item.cantidad_devuelta,
        cantidad_dañada_devuelta: item.cantidad_dañada ?? 0,
      })
      .eq('solicitud_id', solicitudId)
      .eq('item_id', item.item_id)
  }

  // Check if all items fully returned
  const { data: pendientes } = await supabase
    .from('utileria_solicitud_items')
    .select('cantidad_entregada, cantidad_devuelta')
    .eq('solicitud_id', solicitudId)

  const todoDevuelto = (pendientes ?? []).every(i => i.cantidad_devuelta >= i.cantidad_entregada)

  await supabase
    .from('utileria_solicitudes')
    .update({
      estado: todoDevuelto ? 'devuelta' : 'devolucion_parcial',
      fecha_devuelta: todoDevuelto ? new Date().toISOString() : null,
    })
    .eq('id', solicitudId)

  revalidatePath('/admin/utileria')
  return formatResult(true, todoDevuelto ? 'Devolución completa' : 'Devolución parcial registrada')
}

export async function cerrarConCargo(solicitudId: string) {
  await requireStaff()
  const supabase = await createClient()
  const p = await obtenerPermisosUtileria()

  const { data, error } = await supabase.rpc('fn_generar_cargos_reposicion', {
    p_solicitud_id: solicitudId,
    p_actor_persona_id: p.persona_id,
  })

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  const row = Array.isArray(data) ? data[0] : data
  return formatResult(true, `${row?.cargos_generados ?? 0} cargo(s) generados por $${row?.total_monto ?? 0}`, row)
}

export async function cancelarSolicitud(solicitudId: string, motivo: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('utileria_solicitudes')
    .update({
      estado: 'cancelada',
      cancelada_motivo: motivo,
    })
    .eq('id', solicitudId)
    .in('estado', ['solicitada', 'preparada'])

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Solicitud cancelada')
}

// -------------------------------------------------------------------
// Cargos
// -------------------------------------------------------------------

export async function listarCargos(filtros?: {
  estado?: string
  equipo_id?: string
  periodo?: string
}) {
  await requireStaff()
  const supabase = await createClient()

  let query = supabase
    .from('utileria_cargos_reposicion')
    .select(`*,
      equipos!equipo_id(id, nombre),
      utileria_items!item_id(id, nombre, categoria)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.equipo_id) query = query.eq('equipo_id', filtros.equipo_id)
  if (filtros?.periodo) query = query.eq('periodo_emision', filtros.periodo)

  const { data, error } = await query
  if (error) return formatResult(false, error.message)
  return formatResult(true, 'OK', data)
}

export async function reversarCargo(cargoId: string, motivo: string) {
  await requireStaff()
  const supabase = await createClient()
  const p = await obtenerPermisosUtileria()

  const { data, error } = await supabase.rpc('fn_reversar_cargo_reposicion', {
    p_cargo_id: cargoId,
    p_motivo: motivo,
    p_actor_persona_id: p.persona_id,
  })

  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/utileria')
  return formatResult(true, 'Cargo reversado')
}

// -------------------------------------------------------------------
// Dashboard & helpers
// -------------------------------------------------------------------

export async function obtenerDashboardMiga() {
  await requireStaff()
  const supabase = await createClient()

  const ahora = new Date().toISOString()
  const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Solicitudes pendientes de preparar
  const { data: pendientes } = await supabase
    .from('utileria_solicitudes')
    .select('id, fecha_evento, descripcion_evento, equipos!equipo_id(nombre), solicitante:personas!solicitada_por_persona_id(nombre, apellido)')
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'solicitada')
    .order('fecha_evento')
    .limit(20)

  // Preparadas esperando retiro
  const { data: preparadas } = await supabase
    .from('utileria_solicitudes')
    .select('id, fecha_evento, descripcion_evento, equipos!equipo_id(nombre)')
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'preparada')
    .order('fecha_evento')
    .limit(20)

  // Devoluciones vencidas
  const { data: vencidas } = await supabase
    .from('utileria_solicitudes')
    .select('id, fecha_evento, fecha_devolucion_esperada, descripcion_evento, equipos!equipo_id(nombre)')
    .eq('tenant_id', TENANT_ID)
    .in('estado', ['entregada', 'devolucion_parcial'])
    .lt('fecha_devolucion_esperada', ahora)
    .order('fecha_devolucion_esperada')
    .limit(20)

  // Items con stock bajo (< 3)
  const { data: stockBajo } = await supabase
    .from('utileria_items')
    .select('id, nombre, categoria, cantidad_disponible, cantidad_total')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .eq('estado', 'disponible')
    .lt('cantidad_disponible', 3)
    .order('cantidad_disponible')
    .limit(20)

  // Stats
  const { count: totalItems } = await supabase
    .from('utileria_items')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const { count: solicitudesAbiertas } = await supabase
    .from('utileria_solicitudes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .in('estado', ['solicitada', 'preparada', 'entregada', 'devolucion_parcial'])

  const { count: cargosPendientes } = await supabase
    .from('utileria_cargos_reposicion')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'pendiente_emision')

  return {
    pendientes: pendientes ?? [],
    preparadas: preparadas ?? [],
    vencidas: vencidas ?? [],
    stockBajo: stockBajo ?? [],
    stats: {
      totalItems: totalItems ?? 0,
      solicitudesAbiertas: solicitudesAbiertas ?? 0,
      cargosPendientes: cargosPendientes ?? 0,
    },
  }
}

export async function fetchEquiposUtileria() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}
