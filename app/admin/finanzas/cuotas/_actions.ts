'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
// Emitir cuotas masivas
// -------------------------------------------------------------------

export async function emitirCuotasMasivas(
  planId: string,
  padronId: string | null,
  periodo: string // formato YYYY-MM
) {
  const supabase = await createClient()

  // 1. Obtener el plan
  const { data: plan, error: planError } = await supabase
    .from('cuotas_planes')
    .select('*')
    .eq('id', planId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (planError || !plan) {
    return formatResult(false, 'Plan no encontrado')
  }

  if (!plan.activo) {
    return formatResult(false, 'El plan no esta activo')
  }

  // 2. Obtener personas segun padron
  let personaIds: string[] = []

  if (padronId) {
    // Obtener personas del padron especifico
    const { data: personasPadron, error: ppError } = await supabase
      .from('personas_padrones')
      .select('persona_id')
      .eq('padron_id', padronId)
      .eq('tenant_id', TENANT_ID)

    if (ppError) {
      return formatResult(false, `Error al obtener personas del padron: ${ppError.message}`)
    }

    personaIds = (personasPadron || []).map((pp) => pp.persona_id)
  } else {
    // Obtener todas las personas activas del tenant
    const { data: personas, error: pError } = await supabase
      .from('personas')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'activo')
      .is('deleted_at', null)

    if (pError) {
      return formatResult(false, `Error al obtener personas: ${pError.message}`)
    }

    personaIds = (personas || []).map((p) => p.id)
  }

  if (personaIds.length === 0) {
    return formatResult(false, 'No se encontraron personas para emitir cuotas')
  }

  // 3. Obtener bonificaciones activas del plan
  const { data: bonificaciones } = await supabase
    .from('cuotas_bonificaciones')
    .select('*')
    .eq('plan_id', planId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  // 4. Calcular fecha de vencimiento
  const [anio, mes] = periodo.split('-').map(Number)
  const diaVenc = Math.min(plan.dia_vencimiento, 28)
  const fechaVencimiento = new Date(anio, mes - 1, diaVenc).toISOString().split('T')[0]

  // 5. Verificar que no existan cuotas ya emitidas para este plan+periodo
  const { data: existentes } = await supabase
    .from('cuotas_emitidas')
    .select('persona_id')
    .eq('plan_id', planId)
    .eq('periodo', periodo)
    .eq('tenant_id', TENANT_ID)

  const existentesSet = new Set((existentes || []).map((e) => e.persona_id))
  const personasNuevas = personaIds.filter((id) => !existentesSet.has(id))

  if (personasNuevas.length === 0) {
    return formatResult(false, 'Todas las cuotas ya fueron emitidas para este periodo')
  }

  // 6. Calcular montos con bonificaciones y crear cuotas
  const cuotasToInsert = personasNuevas.map((personaId) => {
    let montoFinal = plan.monto
    const bonificacionesAplicadas: Array<{ nombre: string; descuento: number }> = []

    if (bonificaciones && bonificaciones.length > 0) {
      for (const bonif of bonificaciones) {
        let descuento = 0
        if (bonif.tipo === 'porcentaje') {
          descuento = montoFinal * (bonif.valor / 100)
        } else if (bonif.tipo === 'monto_fijo') {
          descuento = bonif.valor
        }
        montoFinal = Math.max(0, montoFinal - descuento)
        bonificacionesAplicadas.push({ nombre: bonif.nombre, descuento })
      }
    }

    return {
      tenant_id: TENANT_ID,
      plan_id: planId,
      persona_id: personaId,
      periodo,
      monto_original: plan.monto,
      monto_final: montoFinal,
      moneda: plan.moneda || 'ARS',
      fecha_vencimiento: fechaVencimiento,
      estado: 'pendiente' as const,
      bonificaciones_aplicadas: bonificacionesAplicadas,
      metadata: {},
    }
  })

  const { error: insertError } = await supabase
    .from('cuotas_emitidas')
    .insert(cuotasToInsert)

  if (insertError) {
    return formatResult(false, `Error al emitir cuotas: ${insertError.message}`)
  }

  // 7. Crear registro de emision
  const { error: emisionError } = await supabase
    .from('emisiones_cuota')
    .insert({
      tenant_id: TENANT_ID,
      plan_id: planId,
      padron_id: padronId,
      periodo,
      cantidad: personasNuevas.length,
      monto_unitario: plan.monto,
      metadata: {},
    })

  if (emisionError) {
    // No es critico, la emision ya se hizo
    console.error('Error al registrar emision:', emisionError.message)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, `Se emitieron ${personasNuevas.length} cuotas correctamente`, {
    cantidad: personasNuevas.length,
  })
}

// -------------------------------------------------------------------
// Cobrar cuota
// -------------------------------------------------------------------

export async function cobrarCuota(
  cuotaId: string,
  cajaId: string,
  medioPagoId: string
) {
  const supabase = await createClient()

  // 1. Obtener cuota
  const { data: cuota, error: cuotaError } = await supabase
    .from('cuotas_emitidas')
    .select('*, cuotas_planes(nombre)')
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (cuotaError || !cuota) {
    return formatResult(false, 'Cuota no encontrada')
  }

  if (cuota.estado === 'pagada') {
    return formatResult(false, 'La cuota ya esta pagada')
  }

  if (cuota.estado === 'anulada') {
    return formatResult(false, 'La cuota esta anulada')
  }

  // 2. Crear movimiento de caja (ingreso)
  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_caja')
    .insert({
      tenant_id: TENANT_ID,
      caja_id: cajaId,
      tipo: 'ingreso',
      monto: cuota.monto_final,
      moneda: cuota.moneda || 'ARS',
      medio_pago_id: medioPagoId,
      concepto: `Cobro cuota: ${cuota.cuotas_planes?.nombre || 'Plan'} - ${cuota.periodo}`,
      persona_id: cuota.persona_id,
      referencia_tipo: 'cuota_emitida',
      referencia_id: cuotaId,
      metadata: {},
    })
    .select('id')
    .single()

  if (movError) {
    return formatResult(false, `Error al crear movimiento: ${movError.message}`)
  }

  // 3. Actualizar cuota
  const { error: updateError } = await supabase
    .from('cuotas_emitidas')
    .update({
      estado: 'pagada',
      fecha_pago: new Date().toISOString(),
      movimiento_id: movimiento.id,
    })
    .eq('id', cuotaId)
    .eq('tenant_id', TENANT_ID)

  if (updateError) {
    return formatResult(false, `Error al actualizar cuota: ${updateError.message}`)
  }

  revalidatePath('/admin/finanzas/cuotas')
  return formatResult(true, 'Cuota cobrada correctamente')
}

// -------------------------------------------------------------------
// Anular cuota
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

// -------------------------------------------------------------------
// Contar personas afectadas por emision
// -------------------------------------------------------------------

export async function contarPersonasEmision(
  planId: string,
  padronId: string | null,
  periodo: string
) {
  const supabase = await createClient()

  let totalPersonas = 0

  if (padronId) {
    const { count, error } = await supabase
      .from('personas_padrones')
      .select('*', { count: 'exact', head: true })
      .eq('padron_id', padronId)
      .eq('tenant_id', TENANT_ID)

    if (error) return formatResult(false, error.message)
    totalPersonas = count ?? 0
  } else {
    const { count, error } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'activo')
      .is('deleted_at', null)

    if (error) return formatResult(false, error.message)
    totalPersonas = count ?? 0
  }

  // Restar las que ya tienen cuota emitida para este periodo+plan
  const { count: yaEmitidas } = await supabase
    .from('cuotas_emitidas')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .eq('periodo', periodo)
    .eq('tenant_id', TENANT_ID)

  const nuevas = Math.max(0, totalPersonas - (yaEmitidas ?? 0))

  return formatResult(true, 'Conteo realizado', {
    total_personas: totalPersonas,
    ya_emitidas: yaEmitidas ?? 0,
    nuevas,
  })
}
