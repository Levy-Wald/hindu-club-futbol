'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCapability } from '@/lib/permissions/capabilities'
import { resolverCuentasMovimiento } from './helpers-contables'
import { TENANT_ID } from '@/lib/tenant'


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

interface CajaInput {
  nombre: string
  tipo: string
  tipo_fiscal: string
  moneda: string
  cuenta_id: string | null
  responsable_id: string | null
  entidad_id: string | null
  actividad_slug: string | null
  banco_nombre: string | null
  cbu: string | null
  numero_cuenta: string | null
  descripcion: string | null
  activa: boolean
}

function parseCajaInput(formData: FormData): CajaInput {
  return {
    nombre: (formData.get('nombre') as string) || '',
    tipo: (formData.get('tipo') as string) || 'efectivo',
    tipo_fiscal: (formData.get('tipo_fiscal') as string) || 'blanco',
    moneda: (formData.get('moneda') as string) || 'ARS',
    cuenta_id: (formData.get('cuenta_id') as string) || null,
    responsable_id: (formData.get('responsable_id') as string) || null,
    entidad_id: (formData.get('entidad_id') as string) || null,
    actividad_slug: (formData.get('actividad_slug') as string) || null,
    banco_nombre: (formData.get('banco_nombre') as string) || null,
    cbu: (formData.get('cbu') as string) || null,
    numero_cuenta: (formData.get('numero_cuenta') as string) || null,
    descripcion: (formData.get('descripcion') as string) || null,
    activa: formData.get('activa') !== 'false',
  }
}

export async function crearCaja(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const input = parseCajaInput(formData)

  if (!input.nombre.trim()) return fail('El nombre es obligatorio')
  if (!input.tipo) return fail('El tipo es obligatorio')

  const { data, error } = await supabase
    .from('cajas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      tipo_fiscal: input.tipo_fiscal,
      moneda: input.moneda,
      cuenta_id: input.cuenta_id,
      responsable_id: input.responsable_id,
      entidad_id: input.entidad_id,
      actividad_slug: input.actividad_slug?.trim() || null,
      banco_nombre: input.banco_nombre?.trim() || null,
      cbu: input.cbu?.trim() || null,
      numero_cuenta: input.numero_cuenta?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      activa: input.activa,
      saldo_actual: 0,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear caja: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok(data)
}

export async function editarCaja(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const input = parseCajaInput(formData)

  if (!input.nombre.trim()) return fail('El nombre es obligatorio')
  if (!input.tipo) return fail('El tipo es obligatorio')

  const { error } = await supabase
    .from('cajas')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      tipo_fiscal: input.tipo_fiscal,
      moneda: input.moneda,
      cuenta_id: input.cuenta_id,
      responsable_id: input.responsable_id,
      entidad_id: input.entidad_id,
      actividad_slug: input.actividad_slug?.trim() || null,
      banco_nombre: input.banco_nombre?.trim() || null,
      cbu: input.cbu?.trim() || null,
      numero_cuenta: input.numero_cuenta?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      activa: input.activa,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al editar caja: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  revalidatePath(`/admin/finanzas/cajas/${id}`)
  return ok()
}

export async function eliminarCaja(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cajas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar caja: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}

export async function reactivarCaja(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cajas')
    .update({ deleted_at: null, activa: true })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al reactivar caja: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}

// =============================================================================
// Movimientos
// =============================================================================

export async function crearMovimiento(formData: FormData) {
  const auth = await requireCapability('finanzas.write')
  if (!auth.ok) return { success: false, error: auth.error }

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
  const productoId = formData.get('producto_id') as string | null
  const cuentaDebeId = formData.get('cuenta_debe_id') as string | null
  const cuentaHaberId = formData.get('cuenta_haber_id') as string | null

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

  // Auto-resolver cuentas contables si hay producto y no se pasaron manualmente
  let resolvedCuentaDebeId = cuentaDebeId || null
  let resolvedCuentaHaberId = cuentaHaberId || null
  const warnings: string[] = []

  if (productoId && !cuentaDebeId && !cuentaHaberId && tipo !== 'transferencia') {
    const signo = tipo as 'ingreso' | 'egreso'
    const resueltas = await resolverCuentasMovimiento({
      producto_id: productoId,
      signo,
      caja_id: cajaId,
    })

    // Si hay warning bloqueante (uso_interno + ingreso), rechazar
    if (resueltas.warnings.some(w => w.includes('no deberia generar ingresos'))) {
      return { success: false, error: resueltas.warnings[0] }
    }

    resolvedCuentaDebeId = resueltas.cuenta_debe_id
    resolvedCuentaHaberId = resueltas.cuenta_haber_id
    warnings.push(...resueltas.warnings)
  }

  // Auto-imputación via categoría + caja (si no se resolvió por producto ni manualmente)
  if (!resolvedCuentaDebeId && !resolvedCuentaHaberId && tipo !== 'transferencia' && categoriaId) {
    const [{ data: cat }, { data: cajaData }] = await Promise.all([
      supabase.from('catalogo_categorias_movimiento')
        .select('cuenta_contable_id').eq('id', categoriaId).single(),
      supabase.from('cajas')
        .select('cuenta_id').eq('id', cajaId).single(),
    ])
    const catCuentaId = cat?.cuenta_contable_id ?? null
    const cajaCuentaId = cajaData?.cuenta_id ?? null
    if (!cajaCuentaId) console.warn('[auto-imputacion] Caja sin cuenta contable:', cajaId)
    if (!catCuentaId) console.warn('[auto-imputacion] Categoria sin cuenta contable:', categoriaId)
    if (tipo === 'ingreso') {
      resolvedCuentaDebeId = cajaCuentaId
      resolvedCuentaHaberId = catCuentaId
    } else {
      resolvedCuentaDebeId = catCuentaId
      resolvedCuentaHaberId = cajaCuentaId
    }
  }

  // Auto-imputación transferencias via cuentas de cajas
  if (!resolvedCuentaDebeId && !resolvedCuentaHaberId && tipo === 'transferencia' && cajaDestinoId) {
    const [{ data: cajaOrigen }, { data: cajaDest }] = await Promise.all([
      supabase.from('cajas').select('cuenta_id').eq('id', cajaId).single(),
      supabase.from('cajas').select('cuenta_id').eq('id', cajaDestinoId).single(),
    ])
    resolvedCuentaDebeId = cajaDest?.cuenta_id ?? null
    resolvedCuentaHaberId = cajaOrigen?.cuenta_id ?? null
    if (!cajaOrigen?.cuenta_id) console.warn('[auto-imputacion] Caja origen sin cuenta:', cajaId)
    if (!cajaDest?.cuenta_id) console.warn('[auto-imputacion] Caja destino sin cuenta:', cajaDestinoId)
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
  if (productoId) insertData.producto_id = productoId
  if (resolvedCuentaDebeId) insertData.cuenta_debe_id = resolvedCuentaDebeId
  if (resolvedCuentaHaberId) insertData.cuenta_haber_id = resolvedCuentaHaberId
  if (tipo === 'transferencia' && cajaDestinoId) {
    insertData.caja_destino_id = cajaDestinoId
  }

  const { error } = await supabase
    .from('movimientos_caja')
    .insert(insertData)

  if (error) {
    return { success: false, error: `Error al crear movimiento: ${error.message}` }
  }

  revalidatePath('/admin/[tenant]/finanzas/movimientos', 'page')
  revalidatePath('/admin/[tenant]/finanzas/cajas', 'page')
  return { success: true, warnings }
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}

// =============================================================================
// Plan de cuentas — desactivar / reactivar
// =============================================================================

export async function desactivarCuenta(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar que no está siendo usada
  const checks = await Promise.all([
    supabase.from('movimientos_caja').select('id', { count: 'exact', head: true })
      .or(`cuenta_debe_id.eq.${id},cuenta_haber_id.eq.${id}`),
    supabase.from('productos').select('id', { count: 'exact', head: true })
      .or(`cuenta_ingreso_id.eq.${id},cuenta_egreso_id.eq.${id}`),
    supabase.from('cajas').select('id', { count: 'exact', head: true })
      .eq('cuenta_id', id).is('deleted_at', null),
    supabase.from('plan_cuentas').select('id', { count: 'exact', head: true })
      .eq('cuenta_padre_id', id).eq('activa', true),
  ])

  const labels = ['movimientos', 'productos', 'cajas', 'sub-cuentas activas']
  for (let i = 0; i < checks.length; i++) {
    const count = checks[i].count ?? 0
    if (count > 0) {
      return fail(`No se puede desactivar: la cuenta tiene ${count} ${labels[i]} asociados`)
    }
  }

  const { error } = await supabase
    .from('plan_cuentas')
    .update({ activa: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al desactivar cuenta: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}

export async function reactivarCuenta(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('plan_cuentas')
    .update({ activa: true })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al reactivar cuenta: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
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

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok(data)
}

// =============================================================================
// Cotizacion
// =============================================================================

export async function actualizarCotizacion(
  fecha: string,
  moneda: string,
  valorCompra: number,
  valorVenta: number,
  fuente: string
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fail('La fecha debe tener formato YYYY-MM-DD')
  }
  if (!moneda || moneda === 'ARS') {
    return fail('La moneda no puede ser ARS (es la moneda base)')
  }
  if (isNaN(valorCompra) || valorCompra <= 0) {
    return fail('El valor de compra debe ser mayor a 0')
  }
  if (isNaN(valorVenta) || valorVenta <= 0) {
    return fail('El valor de venta debe ser mayor a 0')
  }

  const { data, error } = await supabase
    .from('cotizaciones')
    .upsert(
      {
        tenant_id: TENANT_ID,
        fecha,
        moneda,
        valor_compra: valorCompra,
        valor_venta: valorVenta,
        fuente: fuente || 'Manual',
      },
      { onConflict: 'tenant_id,fecha,moneda,fuente' }
    )
    .select('id')
    .single()

  if (error) return fail(`Error al actualizar cotizacion: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok(data)
}

export async function eliminarCotizacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar cotizacion: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}

export async function reabrirPeriodo(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: periodo, error: fetchError } = await supabase
    .from('periodos_contables')
    .select('id, estado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !periodo) return fail('Periodo no encontrado')
  if (periodo.estado === 'abierto') return fail('El periodo ya esta abierto')

  const { error } = await supabase
    .from('periodos_contables')
    .update({
      estado: 'abierto',
      cerrado_por_id: null,
      cerrado_at: null,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al reabrir periodo: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas', 'layout')
  return ok()
}
