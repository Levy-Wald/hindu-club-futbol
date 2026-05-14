'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// =============================================================================
// Dashboard
// =============================================================================

export async function fetchFinanzasDashboard() {
  const supabase = await createClient()

  const { data: cajas } = await supabase
    .from('cajas')
    .select('id, nombre, tipo, moneda, saldo_actual, activa')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .is('deleted_at', null)
    .order('nombre')

  const cajasData = cajas ?? []
  const totalARS = cajasData
    .filter((c) => c.moneda === 'ARS')
    .reduce((acc, c) => acc + Number(c.saldo_actual), 0)
  const totalUSD = cajasData
    .filter((c) => c.moneda === 'USD')
    .reduce((acc, c) => acc + Number(c.saldo_actual), 0)

  const cotizacion = await fetchCotizacionActual()

  const ahora = new Date()
  const inicioMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`
  const { count: movimientosMes } = await supabase
    .from('movimientos_caja')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('anulado', false)
    .gte('fecha', inicioMes)

  const { data: cuotasRaw } = await supabase
    .from('cuotas_emitidas')
    .select('estado')
    .eq('tenant_id', TENANT_ID)

  const cuotasStats = { pendientes: 0, vencidas: 0, pagadas: 0 }
  for (const row of cuotasRaw ?? []) {
    if (row.estado === 'pendiente') cuotasStats.pendientes++
    else if (row.estado === 'vencida') cuotasStats.vencidas++
    else if (row.estado === 'pagada') cuotasStats.pagadas++
  }

  const { data: ultimosMovimientos } = await supabase
    .from('movimientos_caja')
    .select(`
      id, numero, tipo, monto_neto, moneda, fecha, descripcion, anulado,
      caja:cajas(id, nombre),
      categoria:catalogo_categorias_movimiento(id, nombre),
      persona:personas(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('anulado', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    cajas: cajasData,
    totalARS,
    totalUSD,
    equivalenteUSD: cotizacion ? totalARS / Number(cotizacion.valor_venta) + totalUSD : totalUSD,
    movimientosMes: movimientosMes ?? 0,
    cuotasStats,
    ultimosMovimientos: ultimosMovimientos ?? [],
    cotizacion,
  }
}

// =============================================================================
// Cajas
// =============================================================================

export async function fetchCajas(filtros?: {
  tipo?: string
  tipo_fiscal?: string
  entidad_id?: string
  actividad_slug?: string
  estado?: string // 'activa' | 'inactiva' | 'eliminada' | 'todas'
  busqueda?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('cajas')
    .select(`
      *,
      responsable:personas!responsable_id(id, nombre, apellido),
      cuenta:plan_cuentas!cuenta_id(id, codigo, nombre),
      entidad:entidades!entidad_id(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  // Por defecto, ocultar eliminadas
  const estado = filtros?.estado || 'activa'
  if (estado === 'activa') {
    query = query.is('deleted_at', null).eq('activa', true)
  } else if (estado === 'inactiva') {
    query = query.is('deleted_at', null).eq('activa', false)
  } else if (estado === 'eliminada') {
    query = query.not('deleted_at', 'is', null)
  } else if (estado === 'no_eliminada') {
    query = query.is('deleted_at', null)
  }
  // 'todas' = sin filtro

  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros?.tipo_fiscal) query = query.eq('tipo_fiscal', filtros.tipo_fiscal)
  if (filtros?.entidad_id) query = query.eq('entidad_id', filtros.entidad_id)
  if (filtros?.actividad_slug) query = query.eq('actividad_slug', filtros.actividad_slug)
  if (filtros?.busqueda) {
    query = query.ilike('nombre', `%${filtros.busqueda}%`)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchCaja(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cajas')
    .select(`
      *,
      responsable:personas!responsable_id(id, nombre, apellido),
      cuenta:plan_cuentas!cuenta_id(id, codigo, nombre),
      entidad:entidades!entidad_id(id, nombre)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

export async function fetchEntidadesParaCajas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre, tipo')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')

  if (error) return []
  return data ?? []
}

export async function fetchActividadesUsadasEnCajas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cajas')
    .select('actividad_slug')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .not('actividad_slug', 'is', null)

  if (error) return []
  const slugs = [...new Set((data ?? []).map(d => d.actividad_slug).filter(Boolean))]
  return slugs as string[]
}

export async function fetchMovimientosCaja(
  cajaId: string,
  filters?: { fecha_desde?: string; fecha_hasta?: string; tipo?: string }
) {
  const supabase = await createClient()

  let query = supabase
    .from('movimientos_caja')
    .select(`
      *,
      categoria:catalogo_categorias_movimiento(id, nombre, slug),
      medio_pago:medios_pago(id, nombre),
      persona:personas(id, nombre, apellido),
      entidad:entidades(id, nombre),
      comprobante_tipo:tipos_comprobante(id, nombre),
      caja_destino:cajas!caja_destino_id(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.fecha_desde) query = query.gte('fecha', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('fecha', filters.fecha_hasta)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// =============================================================================
// Movimientos
// =============================================================================

export async function fetchMovimientos(filters?: {
  tipo?: string
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  persona_id?: string
  caja_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('movimientos_caja')
    .select(`
      *,
      caja:cajas!caja_id(id, nombre),
      caja_destino:cajas!caja_destino_id(id, nombre),
      categoria:catalogo_categorias_movimiento(id, nombre, slug),
      producto:productos(id, nombre),
      medio_pago:medios_pago(id, nombre),
      centro_costo:centros_costo(id, nombre),
      persona:personas(id, nombre, apellido),
      entidad:entidades(id, nombre),
      comprobante_tipo:tipos_comprobante(id, nombre),
      cuenta_debe:plan_cuentas!cuenta_debe_id(id, codigo, nombre),
      cuenta_haber:plan_cuentas!cuenta_haber_id(id, codigo, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.fecha_desde) query = query.gte('fecha', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('fecha', filters.fecha_hasta)
  if (filters?.categoria_id) query = query.eq('categoria_id', filters.categoria_id)
  if (filters?.persona_id) query = query.eq('persona_id', filters.persona_id)
  if (filters?.caja_id) query = query.eq('caja_id', filters.caja_id)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchMovimiento(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('movimientos_caja')
    .select(`
      *,
      caja:cajas!caja_id(id, nombre, tipo, moneda),
      caja_destino:cajas!caja_destino_id(id, nombre, tipo, moneda),
      categoria:catalogo_categorias_movimiento(id, nombre, slug),
      producto:productos(id, nombre, tipo),
      medio_pago:medios_pago(id, nombre, tipo),
      centro_costo:centros_costo(id, nombre, codigo),
      persona:personas(id, nombre, apellido, numero_documento),
      entidad:entidades(id, nombre),
      comprobante_tipo:tipos_comprobante(id, nombre, slug, letra),
      cuenta_debe:plan_cuentas!cuenta_debe_id(id, codigo, nombre),
      cuenta_haber:plan_cuentas!cuenta_haber_id(id, codigo, nombre),
      anulado_por:personas!anulado_por_id(id, nombre, apellido),
      movimiento_anulacion:movimientos_caja!movimiento_anulacion_id(id, numero)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

// =============================================================================
// Productos / Servicios (para dropdowns en movimientos)
// =============================================================================

export async function fetchProductos(tipo?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('productos')
    .select(`
      *,
      cuenta_ingreso:plan_cuentas!cuenta_ingreso_id(id, codigo, nombre),
      cuenta_egreso:plan_cuentas!cuenta_egreso_id(id, codigo, nombre),
      categoria_movimiento:catalogo_categorias_movimiento(id, nombre),
      centro_costo:centros_costo(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchProducto(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      cuenta_ingreso:plan_cuentas!cuenta_ingreso_id(id, codigo, nombre),
      cuenta_egreso:plan_cuentas!cuenta_egreso_id(id, codigo, nombre),
      categoria_movimiento:catalogo_categorias_movimiento(id, nombre),
      centro_costo:centros_costo(id, nombre)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

// =============================================================================
// Cuotas (queries base — RPCs en cuotas.ts)
// =============================================================================

export async function fetchCuotasPlanes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuotas_planes')
    .select(`*, producto:productos(id, nombre, tipo)`)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (error) return []
  return data ?? []
}

export async function fetchCuotasPlan(id: string) {
  const supabase = await createClient()

  const { data: plan, error: planError } = await supabase
    .from('cuotas_planes')
    .select(`*, producto:productos(id, nombre, tipo, precio, moneda)`)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (planError) return null

  const { data: bonificaciones } = await supabase
    .from('cuotas_bonificaciones')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .or(`plan_id.eq.${id},plan_id.is.null`)
    .eq('activa', true)
    .order('prioridad')

  return { ...plan, bonificaciones: bonificaciones ?? [] }
}

export async function fetchCuotasEmitidas(filters?: {
  plan_id?: string
  estado?: string
  periodo?: string
  persona_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('cuotas_emitidas')
    .select(`
      *,
      plan:cuotas_planes(id, nombre, periodicidad),
      persona:personas(id, nombre, apellido, numero_documento),
      movimiento:movimientos_caja!movimiento_id(id, numero, fecha)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('fecha_vencimiento', { ascending: false })

  if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id)
  if (filters?.estado) query = query.eq('estado', filters.estado)
  if (filters?.periodo) query = query.eq('periodo', filters.periodo)
  if (filters?.persona_id) query = query.eq('persona_id', filters.persona_id)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// =============================================================================
// Plan de cuentas
// =============================================================================

export async function fetchPlanCuentas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_cuentas')
    .select(`*, cuenta_padre:plan_cuentas!cuenta_padre_id(id, codigo, nombre)`)
    .eq('tenant_id', TENANT_ID)
    .order('codigo')

  if (error) return []
  return data ?? []
}

export async function fetchCuentasImputables() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, moneda_default')
    .eq('tenant_id', TENANT_ID)
    .eq('es_imputable', true)
    .eq('activa', true)
    .order('codigo')

  if (error) return []
  return data ?? []
}

// =============================================================================
// Auxiliares (selects/dropdowns)
// =============================================================================

export async function fetchMediosPago() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medios_pago')
    .select('id, slug, nombre, tipo, comision_porcentaje, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('orden')

  if (error) return []
  return data ?? []
}

export async function fetchTiposComprobante() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tipos_comprobante')
    .select('id, slug, nombre, codigo_afip, letra, es_fiscal')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('orden')

  if (error) return []
  return data ?? []
}

export async function fetchCentrosCosto() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('centros_costo')
    .select('id, nombre, codigo, tipo, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (error) return []
  return data ?? []
}

export async function fetchCategoriasMovimiento() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('catalogo_categorias_movimiento')
    .select('id, slug, nombre, tipo, descripcion')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('orden')

  if (error) return []
  return data ?? []
}

export async function fetchConfigFinanciera() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('config_financiera')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

export async function fetchCotizacionActual() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
    .eq('moneda', 'USD')
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data
}

// =============================================================================
// Cuenta corriente / Mi cuenta
// =============================================================================

export async function fetchMiCuenta(personaId: string) {
  const supabase = await createClient()

  const { data: cuentaCorriente } = await supabase
    .from('cuentas_corrientes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .maybeSingle()

  const { data: cuotas } = await supabase
    .from('cuotas_emitidas')
    .select(`*, plan:cuotas_planes(id, nombre, periodicidad)`)
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .order('fecha_vencimiento', { ascending: false })
    .limit(50)

  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select(`
      id, numero, tipo, monto_neto, moneda, fecha, descripcion, anulado,
      caja:cajas!caja_id(id, nombre),
      categoria:catalogo_categorias_movimiento(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('anulado', false)
    .order('fecha', { ascending: false })
    .limit(50)

  return {
    cuentaCorriente: cuentaCorriente ?? null,
    cuotas: cuotas ?? [],
    movimientos: movimientos ?? [],
  }
}

export async function fetchConveniosPago(personaId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('convenios_pago')
    .select(`*, persona:personas(id, nombre, apellido, numero_documento)`)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (personaId) query = query.eq('persona_id', personaId)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// =============================================================================
// Periodos contables
// =============================================================================

export async function fetchPeriodosContables() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('periodos_contables')
    .select(`*, cerrado_por:personas!cerrado_por_id(id, nombre, apellido)`)
    .eq('tenant_id', TENANT_ID)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })

  if (error) return []
  return data ?? []
}
