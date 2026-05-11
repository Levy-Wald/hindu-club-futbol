'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion, crearNotificacionMasiva } from '@/modules/notificaciones/lib/crear'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface PlanInput {
  nombre: string
  descripcion: string | null
  periodicidad: string
  monto: number
  moneda: string
  dia_vencimiento: number
  mora_porcentaje: number
  activo: boolean
}

interface BonificacionInput {
  plan_id: string
  nombre: string
  tipo: string // 'porcentaje' | 'monto_fijo'
  valor: number
  condicion: string | null
  activo: boolean
}

// -------------------------------------------------------------------
// Planes CRUD
// -------------------------------------------------------------------

export async function crearPlan(input: PlanInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  if (input.monto <= 0) {
    return formatResult(false, 'El monto debe ser mayor a 0')
  }

  if (input.dia_vencimiento < 1 || input.dia_vencimiento > 28) {
    return formatResult(false, 'El dia de vencimiento debe estar entre 1 y 28')
  }

  const { data, error } = await supabase
    .from('cuotas_planes')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      periodicidad: input.periodicidad,
      monto: input.monto,
      moneda: input.moneda || 'ARS',
      dia_vencimiento: input.dia_vencimiento,
      mora_porcentaje: input.mora_porcentaje || 0,
      activo: input.activo,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear plan: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Plan creado correctamente', { id: data.id })
}

export async function editarPlan(planId: string, input: PlanInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const { error } = await supabase
    .from('cuotas_planes')
    .update({
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      periodicidad: input.periodicidad,
      monto: input.monto,
      moneda: input.moneda || 'ARS',
      dia_vencimiento: input.dia_vencimiento,
      mora_porcentaje: input.mora_porcentaje || 0,
      activo: input.activo,
    })
    .eq('id', planId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar plan: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Plan actualizado correctamente')
}

// -------------------------------------------------------------------
// Bonificaciones CRUD
// -------------------------------------------------------------------

export async function crearBonificacion(input: BonificacionInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  if (input.valor <= 0) {
    return formatResult(false, 'El valor debe ser mayor a 0')
  }

  const { data, error } = await supabase
    .from('cuotas_bonificaciones')
    .insert({
      tenant_id: TENANT_ID,
      plan_id: input.plan_id,
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      valor: input.valor,
      condicion: input.condicion?.trim() || null,
      activo: input.activo,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear bonificacion: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Bonificacion creada correctamente', { id: data.id })
}

export async function editarBonificacion(bonificacionId: string, input: BonificacionInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const { error } = await supabase
    .from('cuotas_bonificaciones')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      valor: input.valor,
      condicion: input.condicion?.trim() || null,
      activo: input.activo,
    })
    .eq('id', bonificacionId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar bonificacion: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Bonificacion actualizada correctamente')
}

// -------------------------------------------------------------------
// Preview emisión (cuenta suscripciones elegibles)
// -------------------------------------------------------------------

export async function previewEmision(planId: string, periodo: string) {
  const supabase = await createClient()

  if (!planId || !periodo) {
    return formatResult(false, 'Plan y periodo son obligatorios')
  }

  // Obtener plan
  const { data: plan, error: planError } = await supabase
    .from('cuotas_planes')
    .select('id, nombre, monto, moneda, dia_vencimiento')
    .eq('id', planId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (planError || !plan) {
    return formatResult(false, 'Plan no encontrado')
  }

  // Contar suscripciones activas al plan
  const [anio, mes] = periodo.split('-').map(Number)
  const ultimoDia = new Date(anio, mes, 0).getDate()
  const ultimoDiaMes = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const { count: totalSuscripciones } = await supabase
    .from('suscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('plan_id', planId)
    .eq('estado', 'activa')
    .lte('fecha_alta', ultimoDiaMes)

  // Verificar si ya hay emisión activa para este plan+periodo
  const { data: emisionExistente } = await supabase
    .from('emisiones_cuota')
    .select('id, cantidad_emitida, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('plan_id', planId)
    .eq('periodo', periodo)
    .eq('estado', 'activa')
    .maybeSingle()

  return formatResult(true, 'Preview calculado', {
    plan_nombre: plan.nombre,
    plan_monto: plan.monto,
    plan_moneda: plan.moneda,
    total_suscripciones: totalSuscripciones ?? 0,
    emision_existente: emisionExistente ? {
      id: emisionExistente.id,
      cantidad: emisionExistente.cantidad_emitida,
    } : null,
    monto_total_estimado: (totalSuscripciones ?? 0) * plan.monto,
  })
}

// -------------------------------------------------------------------
// Emitir cuotas masivas (wraps fn_emitir_cuotas_masivas)
// -------------------------------------------------------------------

export async function emitirCuotasMasivas(planId: string, periodo: string) {
  const supabase = await createClient()

  if (!planId || !periodo) {
    return formatResult(false, 'Plan y periodo son obligatorios')
  }

  const { data, error } = await supabase.rpc('fn_emitir_cuotas_masivas', {
    p_tenant_id: TENANT_ID,
    p_plan_id: planId,
    p_periodo: periodo,
  })

  if (error) {
    return formatResult(false, `Error al emitir cuotas: ${error.message}`)
  }

  // Function returns TABLE rows — first row is the result
  const rows = data as Array<{
    emision_id: string
    total_emitidas: number
    total_skipped: number
    total_monto: number
    detalle: { ya_existia?: boolean; plan_nombre?: string }
  }>
  const result = rows[0]

  if (!result) {
    return formatResult(false, 'Error inesperado: sin resultado de emisión')
  }

  if (result.detalle?.ya_existia) {
    return formatResult(false, `Ya existe una emisión activa para este plan y periodo (${result.total_emitidas} cuotas)`)
  }

  // Notificar a cada persona que se le emitió cuota
  if (result.total_emitidas > 0) {
    const { data: cuotasEmitidas } = await supabase
      .from('cuotas_emitidas')
      .select('id, persona_id, monto_final, periodo')
      .eq('emision_id', result.emision_id)
      .eq('tenant_id', TENANT_ID)

    if (cuotasEmitidas && cuotasEmitidas.length > 0) {
      const { data: plan } = await supabase
        .from('cuotas_planes')
        .select('nombre')
        .eq('id', planId)
        .single()

      const destinatarios = cuotasEmitidas.map(c => c.persona_id)
      crearNotificacionMasiva(destinatarios, {
        tenant_id: TENANT_ID,
        tipo: 'cuota_emitida',
        titulo: `Nueva cuota: ${plan?.nombre ?? 'Plan'}`,
        mensaje: `Se emitió tu cuota del período ${periodo}. Monto: $${cuotasEmitidas[0]?.monto_final ?? result.total_monto}`,
        prioridad: 'media',
        origen_tabla: 'emisiones_cuota',
        origen_registro_id: result.emision_id,
        origen_evento: 'emision_masiva',
      }).catch(() => {})
    }
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, `Se emitieron ${result.total_emitidas} cuotas correctamente`, {
    emision_id: result.emision_id,
    total_emitidas: result.total_emitidas,
    total_skipped: result.total_skipped,
    total_monto: result.total_monto,
  })
}

// -------------------------------------------------------------------
// Anular emisión (wraps fn_anular_emision)
// -------------------------------------------------------------------

export async function anularEmision(emisionId: string, motivo?: string) {
  const supabase = await createClient()

  if (!emisionId) {
    return formatResult(false, 'ID de emisión es obligatorio')
  }

  const { data, error } = await supabase.rpc('fn_anular_emision', {
    p_emision_id: emisionId,
    p_motivo: motivo || 'Anulación manual',
  })

  if (error) {
    return formatResult(false, `Error al anular emisión: ${error.message}`)
  }

  const rows = data as Array<{
    cuotas_anuladas: number
    cuotas_no_anulables: number
    estado_final: string
  }>
  const result = rows[0]

  if (!result) {
    return formatResult(false, 'Error inesperado: sin resultado de anulación')
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(
    true,
    `Emisión anulada: ${result.cuotas_anuladas} cuotas anuladas` +
    (result.cuotas_no_anulables > 0 ? `, ${result.cuotas_no_anulables} ya pagadas (no se anulan)` : ''),
    result
  )
}

// -------------------------------------------------------------------
// Fetch emisiones
// -------------------------------------------------------------------

export async function fetchEmisiones() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('emisiones_cuota')
    .select('id, plan_id, periodo, cantidad_emitida, monto_total, estado, anulada_at, anulada_motivo, created_at, cuotas_planes(nombre)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data ?? []
}

// -------------------------------------------------------------------
// Fetch cuotas con vista v_cuotas_completas
// -------------------------------------------------------------------

export async function fetchCuotasCompletas(filters?: {
  plan_id?: string
  periodo?: string
  estado?: string
  persona_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('v_cuotas_completas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_vencimiento', { ascending: true })
    .limit(300)

  if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id)
  if (filters?.periodo) query = query.eq('periodo', filters.periodo)
  if (filters?.estado) query = query.eq('estado', filters.estado)
  if (filters?.persona_id) query = query.eq('persona_id', filters.persona_id)

  const { data, error } = await query
  if (error) {
    console.error('fetchCuotasCompletas error:', error.message)
    return []
  }
  return data ?? []
}

// -------------------------------------------------------------------
// Fetch cuenta corriente persona
// -------------------------------------------------------------------

export async function fetchCuentaCorrientePersona(personaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_cuenta_corriente_persona')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)

  if (error) return []
  return data ?? []
}

// -------------------------------------------------------------------
// Cobrar cuota (wraps fn_cobrar_cuota)
// -------------------------------------------------------------------

export async function cobrarCuota(
  cuotaId: string,
  monto: number,
  cajaId: string,
  medioPagoId: string,
  options?: {
    fechaPago?: string
    tipoComprobanteId?: string
    observaciones?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_cobrar_cuota', {
    p_cuota_id: cuotaId,
    p_monto: monto,
    p_medio_pago_id: medioPagoId,
    p_caja_id: cajaId,
    p_fecha_pago: options?.fechaPago || new Date().toISOString().split('T')[0],
    p_tipo_comprobante_id: options?.tipoComprobanteId || null,
    p_observaciones: options?.observaciones || null,
  })

  if (error) {
    if (error.message.includes('duplicada')) {
      return formatResult(false, 'Cobranza duplicada detectada. Esperá unos segundos e intentá de nuevo.')
    }
    if (error.message.includes('excede monto')) {
      return formatResult(false, 'El monto ingresado excede el saldo pendiente de la cuota')
    }
    return formatResult(false, `Error al cobrar: ${error.message}`)
  }

  const rows = data as Array<{
    pago_id: string
    movimiento_id: string
    comprobante_numero: string | null
    nuevo_estado_cuota: string
  }>
  const result = rows[0]

  if (!result) {
    return formatResult(false, 'Error inesperado: sin resultado de cobranza')
  }

  // Notificar pago recibido
  const { data: cuotaCobrada } = await supabase
    .from('cuotas_emitidas')
    .select('persona_id, periodo, plan_id, cuotas_planes(nombre)')
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (cuotaCobrada) {
    const planNombre = (cuotaCobrada.cuotas_planes as unknown as { nombre: string })?.nombre ?? 'Plan'
    crearNotificacion({
      tenant_id: TENANT_ID,
      destinatario_persona_id: cuotaCobrada.persona_id,
      tipo: 'pago_recibido',
      titulo: `Pago registrado: ${planNombre}`,
      mensaje: `Se registró un pago de $${monto} para tu cuota del período ${cuotaCobrada.periodo}.`,
      prioridad: 'baja',
      origen_tabla: 'cuotas_pagos',
      origen_registro_id: result.pago_id,
      origen_evento: 'cobrar_cuota',
    }).catch(() => {})
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Cuota cobrada correctamente', result)
}

// -------------------------------------------------------------------
// Cobrar cuotas masivo (varias cuotas de una persona)
// -------------------------------------------------------------------

export async function cobrarCuotasMasivo(
  cuotaIds: string[],
  cajaId: string,
  medioPagoId: string,
  options?: {
    fechaPago?: string
    tipoComprobanteId?: string
    observaciones?: string
  }
) {
  const supabase = await createClient()
  const resultados: Array<{ cuotaId: string; ok: boolean; error?: string; comprobanteNumero?: string }> = []

  for (const cuotaId of cuotaIds) {
    // Get remaining balance for this cuota
    const { data: cuota } = await supabase
      .from('cuotas_emitidas')
      .select('monto_final')
      .eq('id', cuotaId)
      .eq('tenant_id', TENANT_ID)
      .single()

    if (!cuota) {
      resultados.push({ cuotaId, ok: false, error: 'Cuota no encontrada' })
      continue
    }

    // Get sum of confirmed payments
    const { data: pagosData } = await supabase
      .from('cuotas_pagos')
      .select('monto_pagado')
      .eq('cuota_id', cuotaId)
      .eq('estado', 'confirmado')

    const sumaPagos = (pagosData ?? []).reduce((sum, p) => sum + Number(p.monto_pagado), 0)
    const saldoPendiente = Number(cuota.monto_final) - sumaPagos

    if (saldoPendiente <= 0) {
      resultados.push({ cuotaId, ok: false, error: 'Cuota ya pagada' })
      continue
    }

    const result = await cobrarCuota(cuotaId, saldoPendiente, cajaId, medioPagoId, options)
    resultados.push({
      cuotaId,
      ok: result.ok,
      error: result.ok ? undefined : result.message,
      comprobanteNumero: result.ok ? (result.data as Record<string, unknown>)?.comprobante_numero as string : undefined,
    })
  }

  const exitosas = resultados.filter(r => r.ok).length
  const fallidas = resultados.filter(r => !r.ok).length

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(
    fallidas === 0,
    fallidas === 0
      ? `${exitosas} cuota(s) cobrada(s) correctamente`
      : `${exitosas} cobrada(s), ${fallidas} con error`,
    { resultados }
  )
}

// -------------------------------------------------------------------
// Anular pago (wraps fn_anular_pago)
// -------------------------------------------------------------------

export async function anularPago(pagoId: string, motivo: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_anular_pago', {
    p_pago_id: pagoId,
    p_motivo: motivo || 'Anulación manual',
  })

  if (error) {
    return formatResult(false, `Error al anular pago: ${error.message}`)
  }

  const rows = data as Array<{
    pago_anulado_id: string
    movimiento_reverso_id: string
    nuevo_estado_cuota: string
  }>
  const result = rows[0]

  if (!result) {
    return formatResult(false, 'Error inesperado: sin resultado de anulación')
  }

  // Notificar pago anulado
  const { data: pagoAnulado } = await supabase
    .from('cuotas_pagos')
    .select('cuota_id, monto_pagado, cuotas_emitidas(persona_id, periodo, cuotas_planes(nombre))')
    .eq('id', pagoId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (pagoAnulado) {
    const cuotaInfo = pagoAnulado.cuotas_emitidas as unknown as { persona_id: string; periodo: string; cuotas_planes: { nombre: string } }
    if (cuotaInfo) {
      crearNotificacion({
        tenant_id: TENANT_ID,
        destinatario_persona_id: cuotaInfo.persona_id,
        tipo: 'pago_anulado',
        titulo: `Pago anulado: ${cuotaInfo.cuotas_planes?.nombre ?? 'Plan'}`,
        mensaje: `Se anuló un pago de $${pagoAnulado.monto_pagado} del período ${cuotaInfo.periodo}. Motivo: ${motivo || 'No especificado'}.`,
        prioridad: 'alta',
        origen_tabla: 'cuotas_pagos',
        origen_registro_id: pagoId,
        origen_evento: 'anular_pago',
      }).catch(() => {})
    }
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Pago anulado correctamente', result)
}

// -------------------------------------------------------------------
// Fetch pagos por cuota
// -------------------------------------------------------------------

export async function fetchPagosPorCuota(cuotaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuotas_pagos')
    .select('*, medios_pago(nombre), cajas(nombre)')
    .eq('cuota_id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

// -------------------------------------------------------------------
// Fetch pagos por persona
// -------------------------------------------------------------------

export async function fetchPagosPorPersona(personaId: string, filters?: {
  estado?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('cuotas_pagos')
    .select(`
      *,
      medios_pago(nombre),
      cajas(nombre),
      cuotas_emitidas!inner(persona_id, periodo, plan_id, cuotas_planes(nombre))
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('cuotas_emitidas.persona_id', personaId)
    .order('fecha_pago', { ascending: false })
    .limit(100)

  if (filters?.estado) query = query.eq('estado', filters.estado)

  const { data, error } = await query
  if (error) {
    console.error('fetchPagosPorPersona error:', error.message)
    return []
  }
  return data ?? []
}

// -------------------------------------------------------------------
// Fetch saldo pendiente de cuota (para UI de cobranza)
// -------------------------------------------------------------------

export async function fetchSaldoCuota(cuotaId: string) {
  const supabase = await createClient()

  const { data: cuota } = await supabase
    .from('cuotas_emitidas')
    .select('monto_final, estado')
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!cuota) return { monto_final: 0, suma_pagos: 0, saldo_pendiente: 0 }

  const { data: pagos } = await supabase
    .from('cuotas_pagos')
    .select('monto_pagado')
    .eq('cuota_id', cuotaId)
    .eq('estado', 'confirmado')

  const sumaPagos = (pagos ?? []).reduce((sum, p) => sum + Number(p.monto_pagado), 0)

  return {
    monto_final: Number(cuota.monto_final),
    suma_pagos: sumaPagos,
    saldo_pendiente: Number(cuota.monto_final) - sumaPagos,
  }
}

// -------------------------------------------------------------------
// Anular cuota individual
// -------------------------------------------------------------------

export async function anularCuota(cuotaId: string) {
  const supabase = await createClient()

  const { data: cuota, error: cuotaError } = await supabase
    .from('cuotas_emitidas')
    .select('estado')
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (cuotaError || !cuota) {
    return formatResult(false, 'Cuota no encontrada')
  }

  if (cuota.estado === 'pagada') {
    return formatResult(false, 'No se puede anular una cuota ya pagada')
  }

  if (cuota.estado === 'anulada') {
    return formatResult(false, 'La cuota ya esta anulada')
  }

  const { error } = await supabase
    .from('cuotas_emitidas')
    .update({ estado: 'anulada' })
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al anular cuota: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Cuota anulada correctamente')
}
