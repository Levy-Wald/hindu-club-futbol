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

export async function crearMovimiento(formData: FormData) {
  const supabase = await createClient()

  const tipo = formData.get('tipo') as string
  const cajaId = formData.get('caja_id') as string
  const cajaDestinoId = formData.get('caja_destino_id') as string | null
  const montoBruto = parseFloat(formData.get('monto_bruto') as string) || 0
  const impuestos = parseFloat(formData.get('impuestos') as string) || 0
  const retenciones = parseFloat(formData.get('retenciones') as string) || 0
  const montoNeto = parseFloat(formData.get('monto_neto') as string) || montoBruto - impuestos - retenciones
  const categoriaId = formData.get('categoria_id') as string | null
  const medioPagoId = formData.get('medio_pago_id') as string | null
  const personaId = formData.get('persona_id') as string | null
  const entidadNombre = formData.get('entidad_nombre') as string | null
  const comprobanteTipo = formData.get('comprobante_tipo') as string | null
  const comprobanteNumero = formData.get('comprobante_numero') as string | null
  const centroCostoId = formData.get('centro_costo_id') as string | null
  const fecha = formData.get('fecha') as string
  const descripcion = formData.get('descripcion') as string | null

  // Validaciones basicas
  if (!tipo || !['ingreso', 'egreso', 'transferencia'].includes(tipo)) {
    return { success: false, error: 'Tipo de movimiento invalido' }
  }
  if (!cajaId) {
    return { success: false, error: 'Debe seleccionar una caja' }
  }
  if (tipo === 'transferencia' && !cajaDestinoId) {
    return { success: false, error: 'Debe seleccionar una caja destino para la transferencia' }
  }
  if (montoBruto <= 0) {
    return { success: false, error: 'El monto bruto debe ser mayor a cero' }
  }
  if (!fecha) {
    return { success: false, error: 'Debe indicar una fecha' }
  }

  // Validar periodo contable abierto
  const periodoContable = fecha.substring(0, 7) // 'YYYY-MM'
  const { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('anio', parseInt(periodoContable.split('-')[0]))
    .eq('mes', parseInt(periodoContable.split('-')[1]))
    .maybeSingle()

  if (periodo && periodo.estado === 'cerrado') {
    return { success: false, error: `El periodo contable ${periodoContable} esta cerrado` }
  }

  // Insert movimiento
  // DB triggers handle: auto-numbering, monto_neto calc, USD conversion, saldo update, cuenta corriente update
  const insertData: Record<string, unknown> = {
    tenant_id: TENANT_ID,
    tipo,
    caja_id: cajaId,
    monto_bruto: montoBruto,
    impuestos,
    retenciones,
    monto_neto: montoNeto,
    fecha,
    periodo_contable: periodoContable,
    descripcion: descripcion || null,
    comprobante_tipo: comprobanteTipo || null,
    comprobante_numero: comprobanteNumero || null,
    entidad_nombre: entidadNombre || null,
  }

  if (categoriaId) insertData.categoria_id = categoriaId
  if (medioPagoId) insertData.medio_pago_id = medioPagoId
  if (personaId) insertData.persona_id = personaId
  if (centroCostoId) insertData.centro_costo_id = centroCostoId
  if (tipo === 'transferencia' && cajaDestinoId) {
    insertData.caja_destino_id = cajaDestinoId
  }

  const { error } = await supabase
    .from('movimientos_caja')
    .insert(insertData)

  if (error) {
    return { success: false, error: `Error al crear movimiento: ${error.message}` }
  }

  revalidatePath('/admin/finanzas/movimientos')
  revalidatePath('/admin/finanzas/cajas')
  return { success: true }
}

export async function anularMovimiento(id: string, motivo: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!motivo || motivo.trim().length === 0) {
    return fail('El motivo de anulacion es obligatorio')
  }

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
    return fail('El movimiento ya esta anulado')
  }

  // Obtener persona actual para registrar quien anulo
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
    return fail('Codigo, nombre y tipo son obligatorios')
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
      return fail(`Ya existe una cuenta con el codigo ${codigo}`)
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
    return fail('Codigo, nombre y tipo son obligatorios')
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
      return fail(`Ya existe una cuenta con el codigo ${codigo}`)
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
    return fail(`El convenio no esta vigente (estado: ${convenio.estado})`)
  }

  if (convenio.cuotas_pagadas >= convenio.cantidad_cuotas) {
    return fail('El convenio ya tiene todas las cuotas pagadas')
  }

  const hoy = new Date().toISOString().split('T')[0]
  const nuevaCuotasPagadas = convenio.cuotas_pagadas + 1
  const esUltimaCuota = nuevaCuotasPagadas >= convenio.cantidad_cuotas

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

  const proximoVenc = new Date()
  proximoVenc.setDate(proximoVenc.getDate() + 30)

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
// Configuracion financiera
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

  const { error } = await supabase
    .from('config_financiera')
    .upsert(
      { tenant_id: TENANT_ID, ...updateData },
      { onConflict: 'tenant_id' }
    )

  if (error) return fail(`Error al actualizar configuracion: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

// =============================================================================
// Periodos contables
// =============================================================================

export async function cerrarPeriodo(id: string): Promise<ActionResult> {
  const supabase = await createClient()

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
    return fail('Periodo no encontrado')
  }

  if (periodo.estado === 'cerrado') {
    return fail('El periodo ya esta cerrado')
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

  if (error) return fail(`Error al cerrar periodo: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok()
}

export async function abrirPeriodo(anio: number, mes: number): Promise<ActionResult> {
  const supabase = await createClient()

  if (mes < 1 || mes > 12) {
    return fail('El mes debe estar entre 1 y 12')
  }
  if (anio < 2000 || anio > 2100) {
    return fail('El ano no es valido')
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

  if (error) return fail(`Error al abrir periodo: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}

// =============================================================================
// Cotizacion
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

  if (error) return fail(`Error al actualizar cotizacion: ${error.message}`)

  revalidatePath('/admin/finanzas')
  return ok(data)
}
