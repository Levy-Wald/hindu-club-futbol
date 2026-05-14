'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type ActionResult = { success: boolean; error?: string; data?: unknown }

function ok(data?: unknown): ActionResult {
  return { success: true, data }
}

function fail(error: string): ActionResult {
  return { success: false, error }
}

// =============================================================================
// Cajas
// =============================================================================

export async function crearCaja(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const moneda = (formData.get('moneda') as string) || 'ARS'
  const cuentaId = formData.get('cuenta_id') as string | null
  const responsableId = formData.get('responsable_id') as string | null
  const descripcion = formData.get('descripcion') as string | null

  if (!nombre || !tipo) {
    return fail('Nombre y tipo son obligatorios')
  }

  const { data, error } = await supabase
    .from('cajas')
    .insert({
      tenant_id: TENANT_ID,
      nombre,
      tipo,
      moneda,
      cuenta_id: cuentaId || null,
      responsable_id: responsableId || null,
      descripcion: descripcion || null,
      saldo_actual: 0,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear caja: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function editarCaja(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const moneda = formData.get('moneda') as string | null
  const cuentaId = formData.get('cuenta_id') as string | null
  const responsableId = formData.get('responsable_id') as string | null
  const descripcion = formData.get('descripcion') as string | null
  const activaRaw = formData.get('activa')
  const activa = activaRaw === null ? undefined : activaRaw === 'true'

  if (!nombre || !tipo) {
    return fail('Nombre y tipo son obligatorios')
  }

  const updateData: Record<string, unknown> = {
    nombre,
    tipo,
    cuenta_id: cuentaId || null,
    responsable_id: responsableId || null,
    descripcion: descripcion || null,
  }
  if (moneda) updateData.moneda = moneda
  if (activa !== undefined) updateData.activa = activa

  const { error } = await supabase
    .from('cajas')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al editar caja: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Movimientos
// =============================================================================

export async function crearMovimiento(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const tipo = formData.get('tipo') as string | null
  const cajaId = formData.get('caja_id') as string | null
  const montoBrutoRaw = formData.get('monto_bruto') as string | null
  const moneda = (formData.get('moneda') as string) || 'ARS'
  const categoriaId = formData.get('categoria_id') as string | null
  const productoId = formData.get('producto_id') as string | null
  const medioPagoId = formData.get('medio_pago_id') as string | null
  const centroCostoId = formData.get('centro_costo_id') as string | null
  const personaId = formData.get('persona_id') as string | null
  const entidadId = formData.get('entidad_id') as string | null
  const comprobanteTipoId = formData.get('comprobante_tipo_id') as string | null
  const comprobanteNumero = formData.get('comprobante_numero') as string | null
  const comprobanteUrl = formData.get('comprobante_url') as string | null
  const cuentaDebeId = formData.get('cuenta_debe_id') as string | null
  const cuentaHaberId = formData.get('cuenta_haber_id') as string | null
  const cajaDestinoId = formData.get('caja_destino_id') as string | null
  const fecha = (formData.get('fecha') as string) || new Date().toISOString().split('T')[0]
  const fechaValor = formData.get('fecha_valor') as string | null
  const descripcion = formData.get('descripcion') as string | null
  const impuestosRaw = formData.get('impuestos') as string | null
  const retencionesRaw = formData.get('retenciones') as string | null
  const cotizacionUsdRaw = formData.get('cotizacion_usd') as string | null

  if (!tipo || !cajaId || !montoBrutoRaw) {
    return fail('Tipo, caja y monto bruto son obligatorios')
  }

  const montoBruto = parseFloat(montoBrutoRaw)
  if (isNaN(montoBruto) || montoBruto <= 0) {
    return fail('El monto bruto debe ser mayor a 0')
  }

  if (tipo === 'transferencia' && !cajaDestinoId) {
    return fail('Para transferencias, la caja destino es obligatoria')
  }

  if (tipo === 'transferencia' && cajaId === cajaDestinoId) {
    return fail('La caja origen y destino no pueden ser la misma')
  }

  const impuestos = impuestosRaw ? parseFloat(impuestosRaw) : 0
  const retenciones = retencionesRaw ? parseFloat(retencionesRaw) : 0
  const montoNeto = montoBruto - retenciones
  const cotizacionUsd = cotizacionUsdRaw ? parseFloat(cotizacionUsdRaw) : null

  // Calcular periodo contable desde la fecha
  const periodoContable = fecha.substring(0, 7) // 'YYYY-MM'

  // Validar que el período esté abierto
  const { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('anio', parseInt(periodoContable.split('-')[0]))
    .eq('mes', parseInt(periodoContable.split('-')[1]))
    .maybeSingle()

  if (periodo && periodo.estado === 'cerrado') {
    return fail(`El período contable ${periodoContable} está cerrado`)
  }

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({
      tenant_id: TENANT_ID,
      caja_id: cajaId,
      tipo,
      monto_bruto: montoBruto,
      impuestos,
      retenciones,
      monto_neto: montoNeto,
      moneda,
      cotizacion_usd: cotizacionUsd,
      categoria_id: categoriaId || null,
      producto_id: productoId || null,
      medio_pago_id: medioPagoId || null,
      centro_costo_id: centroCostoId || null,
      persona_id: personaId || null,
      entidad_id: entidadId || null,
      comprobante_tipo_id: comprobanteTipoId || null,
      comprobante_numero: comprobanteNumero || null,
      comprobante_url: comprobanteUrl || null,
      cuenta_debe_id: cuentaDebeId || null,
      cuenta_haber_id: cuentaHaberId || null,
      caja_destino_id: cajaDestinoId || null,
      fecha,
      fecha_valor: fechaValor || null,
      periodo_contable: periodoContable,
      descripcion: descripcion || null,
    })
    .select('id, numero')
    .single()

  if (error) return fail(`Error al crear movimiento: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function anularMovimiento(id: string, motivo: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!motivo || motivo.trim().length === 0) {
    return fail('El motivo de anulación es obligatorio')
  }

  // Obtener el movimiento original
  const { data: movimiento, error: fetchError } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !movimiento) {
    return fail('Movimiento no encontrado')
  }

  if (movimiento.anulado) {
    return fail('El movimiento ya está anulado')
  }

  // Obtener persona actual para registrar quién anuló
  let anuladorId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    anuladorId = persona?.id ?? null
  }

  // Marcar como anulado (el trigger revierte los saldos)
  const { error: updateError } = await supabase
    .from('movimientos_caja')
    .update({
      anulado: true,
      anulado_por_id: anuladorId,
      anulado_at: new Date().toISOString(),
      motivo_anulacion: motivo.trim(),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (updateError) return fail(`Error al anular movimiento: ${updateError.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Productos / Servicios
// =============================================================================

export async function crearProducto(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const precioRaw = formData.get('precio') as string | null
  const moneda = (formData.get('moneda') as string) || 'ARS'
  const cuentaIngresoId = formData.get('cuenta_ingreso_id') as string | null
  const cuentaEgresoId = formData.get('cuenta_egreso_id') as string | null
  const categoriaMovimientoId = formData.get('categoria_movimiento_id') as string | null
  const centroCostoId = formData.get('centro_costo_id') as string | null
  const esAranceladoRaw = formData.get('es_arancelado')
  const descripcion = formData.get('descripcion') as string | null

  if (!nombre || !tipo) {
    return fail('Nombre y tipo son obligatorios')
  }

  const precio = precioRaw ? parseFloat(precioRaw) : 0

  const { data, error } = await supabase
    .from('productos')
    .insert({
      tenant_id: TENANT_ID,
      nombre,
      tipo,
      precio,
      moneda,
      cuenta_ingreso_id: cuentaIngresoId || null,
      cuenta_egreso_id: cuentaEgresoId || null,
      categoria_movimiento_id: categoriaMovimientoId || null,
      centro_costo_id: centroCostoId || null,
      es_arancelado: esAranceladoRaw === 'true',
      descripcion: descripcion || null,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear producto: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function editarProducto(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const precioRaw = formData.get('precio') as string | null
  const moneda = formData.get('moneda') as string | null
  const cuentaIngresoId = formData.get('cuenta_ingreso_id') as string | null
  const cuentaEgresoId = formData.get('cuenta_egreso_id') as string | null
  const categoriaMovimientoId = formData.get('categoria_movimiento_id') as string | null
  const centroCostoId = formData.get('centro_costo_id') as string | null
  const esAranceladoRaw = formData.get('es_arancelado')
  const descripcion = formData.get('descripcion') as string | null

  if (!nombre || !tipo) {
    return fail('Nombre y tipo son obligatorios')
  }

  const updateData: Record<string, unknown> = {
    nombre,
    tipo,
    cuenta_ingreso_id: cuentaIngresoId || null,
    cuenta_egreso_id: cuentaEgresoId || null,
    categoria_movimiento_id: categoriaMovimientoId || null,
    centro_costo_id: centroCostoId || null,
    descripcion: descripcion || null,
  }
  if (precioRaw) updateData.precio = parseFloat(precioRaw)
  if (moneda) updateData.moneda = moneda
  if (esAranceladoRaw !== null) updateData.es_arancelado = esAranceladoRaw === 'true'

  const { error } = await supabase
    .from('productos')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al editar producto: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

export async function toggleProducto(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener estado actual
  const { data: producto, error: fetchError } = await supabase
    .from('productos')
    .select('activo')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !producto) {
    return fail('Producto no encontrado')
  }

  const { error } = await supabase
    .from('productos')
    .update({ activo: !producto.activo })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al cambiar estado: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok({ activo: !producto.activo })
}

// =============================================================================
// Cuotas
// =============================================================================

export async function crearPlan(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const productoId = formData.get('producto_id') as string | null
  const periodicidad = formData.get('periodicidad') as string | null
  const montoRaw = formData.get('monto') as string | null
  const moneda = (formData.get('moneda') as string) || 'ARS'
  const diaVencimientoRaw = formData.get('dia_vencimiento') as string | null
  const permiteBonificacionRaw = formData.get('permite_bonificacion')
  const moraPorcentajeRaw = formData.get('mora_porcentaje') as string | null
  const moraDiasGraciaRaw = formData.get('mora_dias_gracia') as string | null
  const descripcion = formData.get('descripcion') as string | null

  if (!nombre || !periodicidad || !montoRaw) {
    return fail('Nombre, periodicidad y monto son obligatorios')
  }

  const monto = parseFloat(montoRaw)
  if (isNaN(monto) || monto <= 0) {
    return fail('El monto debe ser mayor a 0')
  }

  const diaVencimiento = diaVencimientoRaw ? parseInt(diaVencimientoRaw) : 10
  if (diaVencimiento < 1 || diaVencimiento > 28) {
    return fail('El día de vencimiento debe estar entre 1 y 28')
  }

  const { data, error } = await supabase
    .from('cuotas_planes')
    .insert({
      tenant_id: TENANT_ID,
      nombre,
      producto_id: productoId || null,
      periodicidad,
      monto,
      moneda,
      dia_vencimiento: diaVencimiento,
      permite_bonificacion: permiteBonificacionRaw !== 'false',
      mora_porcentaje: moraPorcentajeRaw ? parseFloat(moraPorcentajeRaw) : 5.00,
      mora_dias_gracia: moraDiasGraciaRaw ? parseInt(moraDiasGraciaRaw) : 0,
      descripcion: descripcion || null,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear plan: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function editarPlan(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string | null
  const productoId = formData.get('producto_id') as string | null
  const periodicidad = formData.get('periodicidad') as string | null
  const montoRaw = formData.get('monto') as string | null
  const moneda = formData.get('moneda') as string | null
  const diaVencimientoRaw = formData.get('dia_vencimiento') as string | null
  const permiteBonificacionRaw = formData.get('permite_bonificacion')
  const moraPorcentajeRaw = formData.get('mora_porcentaje') as string | null
  const moraDiasGraciaRaw = formData.get('mora_dias_gracia') as string | null
  const descripcion = formData.get('descripcion') as string | null
  const activoRaw = formData.get('activo')

  if (!nombre || !periodicidad || !montoRaw) {
    return fail('Nombre, periodicidad y monto son obligatorios')
  }

  const monto = parseFloat(montoRaw)
  if (isNaN(monto) || monto <= 0) {
    return fail('El monto debe ser mayor a 0')
  }

  const updateData: Record<string, unknown> = {
    nombre,
    producto_id: productoId || null,
    periodicidad,
    monto,
    descripcion: descripcion || null,
  }
  if (moneda) updateData.moneda = moneda
  if (diaVencimientoRaw) updateData.dia_vencimiento = parseInt(diaVencimientoRaw)
  if (permiteBonificacionRaw !== null) updateData.permite_bonificacion = permiteBonificacionRaw !== 'false'
  if (moraPorcentajeRaw) updateData.mora_porcentaje = parseFloat(moraPorcentajeRaw)
  if (moraDiasGraciaRaw) updateData.mora_dias_gracia = parseInt(moraDiasGraciaRaw)
  if (activoRaw !== null) updateData.activo = activoRaw === 'true'

  const { error } = await supabase
    .from('cuotas_planes')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al editar plan: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

export async function emitirCuotasMasivas(
  planId: string,
  padronId: string | null,
  periodo: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Validar formato de periodo (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return fail('El formato del período debe ser YYYY-MM')
  }

  // Obtener plan
  const { data: plan, error: planError } = await supabase
    .from('cuotas_planes')
    .select('*')
    .eq('id', planId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (planError || !plan) {
    return fail('Plan no encontrado')
  }

  if (!plan.activo) {
    return fail('El plan no está activo')
  }

  // Obtener personas del padrón o todas las activas
  let personaIds: string[] = []

  if (padronId) {
    const { data: personasPadron } = await supabase
      .from('personas_padrones')
      .select('persona_id')
      .eq('tenant_id', TENANT_ID)
      .eq('padron_id', padronId)
      .eq('activo', true)

    personaIds = (personasPadron ?? []).map((pp) => pp.persona_id)
  } else {
    const { data: personasActivas } = await supabase
      .from('personas')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'activo')
      .is('deleted_at', null)

    personaIds = (personasActivas ?? []).map((p) => p.id)
  }

  if (personaIds.length === 0) {
    return fail('No se encontraron personas para emitir cuotas')
  }

  // Calcular fecha de vencimiento
  const [anio, mes] = periodo.split('-').map(Number)
  const diaVenc = plan.dia_vencimiento || 10
  const fechaVencimiento = `${anio}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`

  // Obtener persona actual (emitido_por)
  let emitidoPorId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    emitidoPorId = persona?.id ?? null
  }

  // Crear emisión
  const { data: emision, error: emisionError } = await supabase
    .from('emisiones_cuota')
    .insert({
      tenant_id: TENANT_ID,
      plan_id: planId,
      padron_id: padronId || null,
      periodo,
      cantidad_emitida: 0,
      monto_total: 0,
      emitido_por_id: emitidoPorId,
    })
    .select('id')
    .single()

  if (emisionError) return fail(`Error al crear emisión: ${emisionError.message}`)

  // Crear cuotas para cada persona (ignorar duplicados)
  const cuotasInsert = personaIds.map((personaId) => ({
    tenant_id: TENANT_ID,
    plan_id: planId,
    emision_id: emision.id,
    persona_id: personaId,
    periodo,
    monto_original: plan.monto,
    monto_final: plan.monto,
    moneda: plan.moneda,
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: fechaVencimiento,
    estado: 'pendiente' as const,
  }))

  // Insertar en lotes de 500 para evitar límites
  let totalEmitidas = 0
  let montoTotal = 0
  const batchSize = 500

  for (let i = 0; i < cuotasInsert.length; i += batchSize) {
    const batch = cuotasInsert.slice(i, i + batchSize)
    const { data: inserted, error: insertError } = await supabase
      .from('cuotas_emitidas')
      .upsert(batch, { onConflict: 'tenant_id,plan_id,persona_id,periodo', ignoreDuplicates: true })
      .select('id, monto_final')

    if (insertError) {
      // Continuar con los que se pudieron insertar, algunos pueden ser duplicados
      console.error(`Error en lote ${i}: ${insertError.message}`)
      continue
    }

    const insertedCount = inserted?.length ?? 0
    totalEmitidas += insertedCount
    montoTotal += (inserted ?? []).reduce((acc, c) => acc + Number(c.monto_final), 0)
  }

  // Actualizar emisión con conteo final
  await supabase
    .from('emisiones_cuota')
    .update({
      cantidad_emitida: totalEmitidas,
      monto_total: montoTotal,
    })
    .eq('id', emision.id)

  revalidatePath('/admin/finanzas')
  return ok({ emision_id: emision.id, cantidad_emitida: totalEmitidas, monto_total: montoTotal })
}

export async function cobrarCuota(
  cuotaId: string,
  cajaId: string,
  medioPagoId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener cuota
  const { data: cuota, error: cuotaError } = await supabase
    .from('cuotas_emitidas')
    .select(`
      *,
      plan:cuotas_planes(id, nombre)
    `)
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (cuotaError || !cuota) {
    return fail('Cuota no encontrada')
  }

  if (cuota.estado === 'pagada') {
    return fail('La cuota ya está pagada')
  }

  if (cuota.estado === 'anulada') {
    return fail('La cuota está anulada')
  }

  // Buscar categoría de cuota social
  const { data: categoriaCuota } = await supabase
    .from('catalogo_categorias_movimiento')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', 'cuota_social')
    .maybeSingle()

  const hoy = new Date().toISOString().split('T')[0]

  // Crear movimiento de ingreso
  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_caja')
    .insert({
      tenant_id: TENANT_ID,
      caja_id: cajaId,
      tipo: 'ingreso',
      monto_bruto: cuota.monto_final,
      monto_neto: cuota.monto_final,
      moneda: cuota.moneda,
      categoria_id: categoriaCuota?.id ?? null,
      medio_pago_id: medioPagoId,
      persona_id: cuota.persona_id,
      fecha: hoy,
      descripcion: `Cobro cuota ${cuota.plan?.nombre ?? ''} - Período ${cuota.periodo}`,
    })
    .select('id, numero')
    .single()

  if (movError) return fail(`Error al crear movimiento: ${movError.message}`)

  // Actualizar cuota como pagada
  const { error: updateError } = await supabase
    .from('cuotas_emitidas')
    .update({
      estado: 'pagada',
      fecha_pago: hoy,
      movimiento_id: movimiento.id,
    })
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)

  if (updateError) return fail(`Error al actualizar cuota: ${updateError.message}`)

  revalidatePath('/admin/finanzas')
  return ok({ movimiento_id: movimiento.id, movimiento_numero: movimiento.numero })
}

export async function anularCuota(cuotaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: cuota, error: fetchError } = await supabase
    .from('cuotas_emitidas')
    .select('id, estado')
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !cuota) {
    return fail('Cuota no encontrada')
  }

  if (cuota.estado === 'anulada') {
    return fail('La cuota ya está anulada')
  }

  const { error } = await supabase
    .from('cuotas_emitidas')
    .update({ estado: 'anulada' })
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al anular cuota: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Plan de cuentas
// =============================================================================

export async function crearCuenta(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const codigo = formData.get('codigo') as string | null
  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const cuentaPadreId = formData.get('cuenta_padre_id') as string | null
  const nivelRaw = formData.get('nivel') as string | null
  const esImputableRaw = formData.get('es_imputable')
  const monedaDefault = (formData.get('moneda_default') as string) || 'ARS'

  if (!codigo || !nombre || !tipo) {
    return fail('Código, nombre y tipo son obligatorios')
  }

  const nivel = nivelRaw ? parseInt(nivelRaw) : 1

  const { data, error } = await supabase
    .from('plan_cuentas')
    .insert({
      tenant_id: TENANT_ID,
      codigo,
      nombre,
      tipo,
      cuenta_padre_id: cuentaPadreId || null,
      nivel,
      es_imputable: esImputableRaw === 'true',
      moneda_default: monedaDefault,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una cuenta con el código ${codigo}`)
    }
    return fail(`Error al crear cuenta: ${error.message}`)
  }

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function editarCuenta(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const codigo = formData.get('codigo') as string | null
  const nombre = formData.get('nombre') as string | null
  const tipo = formData.get('tipo') as string | null
  const cuentaPadreId = formData.get('cuenta_padre_id') as string | null
  const nivelRaw = formData.get('nivel') as string | null
  const esImputableRaw = formData.get('es_imputable')
  const monedaDefault = formData.get('moneda_default') as string | null
  const activaRaw = formData.get('activa')

  if (!codigo || !nombre || !tipo) {
    return fail('Código, nombre y tipo son obligatorios')
  }

  const updateData: Record<string, unknown> = {
    codigo,
    nombre,
    tipo,
    cuenta_padre_id: cuentaPadreId || null,
  }
  if (nivelRaw) updateData.nivel = parseInt(nivelRaw)
  if (esImputableRaw !== null) updateData.es_imputable = esImputableRaw === 'true'
  if (monedaDefault) updateData.moneda_default = monedaDefault
  if (activaRaw !== null) updateData.activa = activaRaw === 'true'

  const { error } = await supabase
    .from('plan_cuentas')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una cuenta con el código ${codigo}`)
    }
    return fail(`Error al editar cuenta: ${error.message}`)
  }

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Convenios de pago
// =============================================================================

export async function crearConvenio(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const personaId = formData.get('persona_id') as string | null
  const deudaOriginalRaw = formData.get('deuda_original') as string | null
  const cantidadCuotasRaw = formData.get('cantidad_cuotas') as string | null
  const montoCuotaRaw = formData.get('monto_cuota') as string | null
  const fechaInicio = (formData.get('fecha_inicio') as string) || new Date().toISOString().split('T')[0]
  const proximoVencimiento = formData.get('proximo_vencimiento') as string | null
  const observaciones = formData.get('observaciones') as string | null

  if (!personaId || !deudaOriginalRaw || !cantidadCuotasRaw || !montoCuotaRaw) {
    return fail('Persona, deuda original, cantidad de cuotas y monto de cuota son obligatorios')
  }

  const deudaOriginal = parseFloat(deudaOriginalRaw)
  const cantidadCuotas = parseInt(cantidadCuotasRaw)
  const montoCuota = parseFloat(montoCuotaRaw)

  if (isNaN(deudaOriginal) || deudaOriginal <= 0) {
    return fail('La deuda original debe ser mayor a 0')
  }
  if (isNaN(cantidadCuotas) || cantidadCuotas <= 0) {
    return fail('La cantidad de cuotas debe ser mayor a 0')
  }
  if (isNaN(montoCuota) || montoCuota <= 0) {
    return fail('El monto de cuota debe ser mayor a 0')
  }

  const { data, error } = await supabase
    .from('convenios_pago')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: personaId,
      deuda_original: deudaOriginal,
      cantidad_cuotas: cantidadCuotas,
      monto_cuota: montoCuota,
      fecha_inicio: fechaInicio,
      proximo_vencimiento: proximoVencimiento || null,
      observaciones: observaciones || null,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear convenio: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

export async function pagarCuotaConvenio(
  convenioId: string,
  cajaId: string,
  medioPagoId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener convenio
  const { data: convenio, error: convError } = await supabase
    .from('convenios_pago')
    .select('*')
    .eq('id', convenioId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (convError || !convenio) {
    return fail('Convenio no encontrado')
  }

  if (convenio.estado !== 'vigente') {
    return fail(`El convenio no está vigente (estado: ${convenio.estado})`)
  }

  if (convenio.cuotas_pagadas >= convenio.cantidad_cuotas) {
    return fail('El convenio ya tiene todas las cuotas pagadas')
  }

  const hoy = new Date().toISOString().split('T')[0]
  const nuevaCuotasPagadas = convenio.cuotas_pagadas + 1
  const esUltimaCuota = nuevaCuotasPagadas >= convenio.cantidad_cuotas

  // Crear movimiento de ingreso
  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_caja')
    .insert({
      tenant_id: TENANT_ID,
      caja_id: cajaId,
      tipo: 'ingreso',
      monto_bruto: convenio.monto_cuota,
      monto_neto: convenio.monto_cuota,
      moneda: 'ARS',
      medio_pago_id: medioPagoId,
      persona_id: convenio.persona_id,
      fecha: hoy,
      descripcion: `Convenio de pago - Cuota ${nuevaCuotasPagadas}/${convenio.cantidad_cuotas}`,
    })
    .select('id, numero')
    .single()

  if (movError) return fail(`Error al crear movimiento: ${movError.message}`)

  // Calcular próximo vencimiento (30 días desde hoy)
  const proximoVenc = new Date()
  proximoVenc.setDate(proximoVenc.getDate() + 30)

  // Actualizar convenio
  const { error: updateError } = await supabase
    .from('convenios_pago')
    .update({
      cuotas_pagadas: nuevaCuotasPagadas,
      estado: esUltimaCuota ? 'completado' : 'vigente',
      proximo_vencimiento: esUltimaCuota ? null : proximoVenc.toISOString().split('T')[0],
    })
    .eq('id', convenioId)
    .eq('tenant_id', TENANT_ID)

  if (updateError) return fail(`Error al actualizar convenio: ${updateError.message}`)

  revalidatePath('/admin/finanzas')
  return ok({ movimiento_id: movimiento.id, cuotas_pagadas: nuevaCuotasPagadas, completado: esUltimaCuota })
}

// =============================================================================
// Configuración financiera
// =============================================================================

export async function actualizarConfigFinanciera(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const monedaPrincipal = (formData.get('moneda_principal') as string) || 'ARS'
  const monedaEquivalencia = (formData.get('moneda_equivalencia') as string) || 'USD'
  const comprobanteObligatorioIngresoRaw = formData.get('comprobante_obligatorio_ingreso')
  const comprobanteObligatorioEgresoRaw = formData.get('comprobante_obligatorio_egreso')
  const comprobanteObligatorioTransferenciaRaw = formData.get('comprobante_obligatorio_transferencia')
  const moraAutomaticaRaw = formData.get('mora_automatica')
  const moraPorcentajeRaw = formData.get('mora_porcentaje_default') as string | null
  const moraDiasGraciaRaw = formData.get('mora_dias_gracia_default') as string | null
  const cierreAutomaticoRaw = formData.get('cierre_automatico')
  const numeracionMovimientosRaw = formData.get('numeracion_movimientos')

  const updateData: Record<string, unknown> = {
    moneda_principal: monedaPrincipal,
    moneda_equivalencia: monedaEquivalencia,
  }

  if (comprobanteObligatorioIngresoRaw !== null) {
    updateData.comprobante_obligatorio_ingreso = comprobanteObligatorioIngresoRaw === 'true'
  }
  if (comprobanteObligatorioEgresoRaw !== null) {
    updateData.comprobante_obligatorio_egreso = comprobanteObligatorioEgresoRaw === 'true'
  }
  if (comprobanteObligatorioTransferenciaRaw !== null) {
    updateData.comprobante_obligatorio_transferencia = comprobanteObligatorioTransferenciaRaw === 'true'
  }
  if (moraAutomaticaRaw !== null) {
    updateData.mora_automatica = moraAutomaticaRaw === 'true'
  }
  if (moraPorcentajeRaw) {
    updateData.mora_porcentaje_default = parseFloat(moraPorcentajeRaw)
  }
  if (moraDiasGraciaRaw) {
    updateData.mora_dias_gracia_default = parseInt(moraDiasGraciaRaw)
  }
  if (cierreAutomaticoRaw !== null) {
    updateData.cierre_automatico = cierreAutomaticoRaw === 'true'
  }
  if (numeracionMovimientosRaw !== null) {
    updateData.numeracion_movimientos = numeracionMovimientosRaw === 'true'
  }

  // Upsert: si no existe la config, crearla
  const { error } = await supabase
    .from('config_financiera')
    .upsert(
      { tenant_id: TENANT_ID, ...updateData },
      { onConflict: 'tenant_id' }
    )

  if (error) return fail(`Error al actualizar configuración: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Períodos contables
// =============================================================================

export async function cerrarPeriodo(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener persona actual
  let cerradoPorId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    cerradoPorId = persona?.id ?? null
  }

  const { data: periodo, error: fetchError } = await supabase
    .from('periodos_contables')
    .select('id, estado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !periodo) {
    return fail('Período no encontrado')
  }

  if (periodo.estado === 'cerrado') {
    return fail('El período ya está cerrado')
  }

  const { error } = await supabase
    .from('periodos_contables')
    .update({
      estado: 'cerrado',
      cerrado_por_id: cerradoPorId,
      cerrado_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al cerrar período: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

export async function abrirPeriodo(anio: number, mes: number): Promise<ActionResult> {
  const supabase = await createClient()

  if (mes < 1 || mes > 12) {
    return fail('El mes debe estar entre 1 y 12')
  }
  if (anio < 2000 || anio > 2100) {
    return fail('El año no es válido')
  }

  const { data, error } = await supabase
    .from('periodos_contables')
    .upsert(
      {
        tenant_id: TENANT_ID,
        anio,
        mes,
        estado: 'abierto',
        cerrado_por_id: null,
        cerrado_at: null,
      },
      { onConflict: 'tenant_id,anio,mes' }
    )
    .select('id')
    .single()

  if (error) return fail(`Error al abrir período: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

// =============================================================================
// Cotización
// =============================================================================

export async function actualizarCotizacion(
  fecha: string,
  valorCompra: number,
  valorVenta: number
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fail('La fecha debe tener formato YYYY-MM-DD')
  }
  if (isNaN(valorCompra) || valorCompra <= 0) {
    return fail('El valor de compra debe ser mayor a 0')
  }
  if (isNaN(valorVenta) || valorVenta <= 0) {
    return fail('El valor de venta debe ser mayor a 0')
  }
  if (valorVenta < valorCompra) {
    return fail('El valor de venta no puede ser menor al de compra')
  }

  const { data, error } = await supabase
    .from('cotizaciones')
    .upsert(
      {
        tenant_id: TENANT_ID,
        fecha,
        moneda: 'USD',
        valor_compra: valorCompra,
        valor_venta: valorVenta,
        fuente: 'manual',
      },
      { onConflict: 'tenant_id,fecha,moneda,fuente' }
    )
    .select('id')
    .single()

  if (error) return fail(`Error al actualizar cotización: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}
