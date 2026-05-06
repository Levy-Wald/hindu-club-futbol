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
// Contratos
// =============================================================================

export async function crearContrato(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const personaId = formData.get('persona_id') as string | null
  const modalidad = formData.get('modalidad') as string | null
  const categoriaConvenio = formData.get('categoria_convenio') as string | null
  const fechaInicio = formData.get('fecha_inicio') as string | null
  const fechaFin = formData.get('fecha_fin') as string | null
  const montoRaw = formData.get('monto') as string | null
  const moneda = (formData.get('moneda') as string) || 'ARS'
  const frecuencia = (formData.get('frecuencia') as string) || 'mensual'
  const horasSemanalesRaw = formData.get('horas_semanales') as string | null

  if (!personaId || !modalidad || !fechaInicio || !montoRaw) {
    return fail('Persona, modalidad, fecha de inicio y monto son obligatorios')
  }

  const monto = parseFloat(montoRaw)
  if (isNaN(monto) || monto <= 0) {
    return fail('El monto debe ser mayor a 0')
  }

  const horasSemanales = horasSemanalesRaw ? parseFloat(horasSemanalesRaw) : null

  // Crear contrato (puesto/area/cuil/legajo ya no van acá, son datos de la persona)
  const { data, error } = await supabase
    .from('rrhh_contratos')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: personaId,
      modalidad,
      categoria_convenio: categoriaConvenio || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
      monto,
      moneda,
      frecuencia,
      horas_semanales: horasSemanales,
    })
    .select('id')
    .single()

  if (error) return fail(`Error al crear contrato: ${error.message}`)

  // Asegurar que la persona tenga el atributo rrhh.empleado
  const { data: existente } = await supabase
    .from('personas_atributos')
    .select('id, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('atributo_slug', 'rrhh.empleado')
    .maybeSingle()

  if (existente) {
    if (!existente.activo) {
      await supabase
        .from('personas_atributos')
        .update({ activo: true })
        .eq('id', existente.id)
    }
  } else {
    await supabase
      .from('personas_atributos')
      .insert({
        tenant_id: TENANT_ID,
        persona_id: personaId,
        atributo_slug: 'rrhh.empleado',
        activo: true,
      })
  }

  revalidatePath('/admin/rrhh')
  return ok(data)
}

export async function editarContrato(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const modalidad = formData.get('modalidad') as string | null
  const categoriaConvenio = formData.get('categoria_convenio') as string | null
  const fechaInicio = formData.get('fecha_inicio') as string | null
  const fechaFin = formData.get('fecha_fin') as string | null
  const montoRaw = formData.get('monto') as string | null
  const moneda = formData.get('moneda') as string | null
  const frecuencia = formData.get('frecuencia') as string | null
  const horasSemanalesRaw = formData.get('horas_semanales') as string | null

  if (!modalidad || !fechaInicio || !montoRaw) {
    return fail('Modalidad, fecha de inicio y monto son obligatorios')
  }

  const monto = parseFloat(montoRaw)
  if (isNaN(monto) || monto <= 0) {
    return fail('El monto debe ser mayor a 0')
  }

  const updateData: Record<string, unknown> = {
    modalidad,
    categoria_convenio: categoriaConvenio || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin || null,
    monto,
  }
  if (moneda) updateData.moneda = moneda
  if (frecuencia) updateData.frecuencia = frecuencia
  if (horasSemanalesRaw) updateData.horas_semanales = parseFloat(horasSemanalesRaw)

  const { error } = await supabase
    .from('rrhh_contratos')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al editar contrato: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}

export async function rescindirContrato(id: string, motivo: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!motivo || motivo.trim().length === 0) {
    return fail('El motivo de rescisión es obligatorio')
  }

  const { data: contrato, error: fetchError } = await supabase
    .from('rrhh_contratos')
    .select('id, estado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !contrato) {
    return fail('Contrato no encontrado')
  }

  if (contrato.estado === 'rescindido') {
    return fail('El contrato ya está rescindido')
  }

  const { error } = await supabase
    .from('rrhh_contratos')
    .update({
      estado: 'rescindido',
      motivo_fin: motivo.trim(),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al rescindir contrato: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}

export async function eliminarContrato(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar que no tenga liquidaciones pagadas
  const { data: liquidacionesPagadas, error: liqError } = await supabase
    .from('rrhh_liquidaciones')
    .select('id')
    .eq('contrato_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'pagada')
    .is('deleted_at', null)
    .limit(1)

  if (liqError) return fail(`Error al verificar liquidaciones: ${liqError.message}`)

  if (liquidacionesPagadas && liquidacionesPagadas.length > 0) {
    return fail('No se puede eliminar un contrato con liquidaciones pagadas')
  }

  const { error } = await supabase
    .from('rrhh_contratos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar contrato: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}

// =============================================================================
// Datos laborales de persona
// =============================================================================

export async function guardarDatosLaborales(personaId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const areaTrabajo = formData.get('area_trabajo_slug') as string | null
  const puestoSlug = formData.get('puesto_slug') as string | null
  const rolLaboral = formData.get('rol_laboral_slug') as string | null
  const numeroLegajo = formData.get('numero_legajo') as string | null
  const obraSocial = formData.get('obra_social_slug') as string | null
  const sindicato = formData.get('sindicato') as string | null

  const datos = {
    persona_id: personaId,
    tenant_id: TENANT_ID,
    area_trabajo_slug: areaTrabajo || null,
    puesto_slug: puestoSlug || null,
    rol_laboral_slug: rolLaboral || null,
    numero_legajo: numeroLegajo || null,
    obra_social_slug: obraSocial || null,
    sindicato: sindicato || null,
  }

  // Upsert — persona_id is PK
  const { error } = await supabase
    .from('personas_datos_laborales')
    .upsert(datos, { onConflict: 'persona_id' })

  if (error) {
    if (error.message.includes('idx_personas_datos_laborales_legajo')) {
      return fail('Ese número de legajo ya está asignado a otra persona')
    }
    return fail(`Error al guardar datos laborales: ${error.message}`)
  }

  revalidatePath('/admin/rrhh')
  revalidatePath(`/admin/personas/${personaId}`)
  return ok()
}

// =============================================================================
// Liquidaciones
// =============================================================================

export async function crearLiquidacion(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const contratoId = formData.get('contrato_id') as string | null
  const periodo = formData.get('periodo') as string | null
  const montoBrutoRaw = formData.get('monto_bruto') as string | null
  const deduccionesRaw = formData.get('deducciones') as string | null
  const aportesPatronalesRaw = formData.get('aportes_patronales') as string | null
  const bonificacionesRaw = formData.get('bonificaciones') as string | null
  const conceptosRaw = formData.get('conceptos') as string | null
  const observaciones = formData.get('observaciones') as string | null

  if (!contratoId || !periodo || !montoBrutoRaw) {
    return fail('Contrato, período y monto bruto son obligatorios')
  }

  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return fail('El formato del período debe ser YYYY-MM')
  }

  const montoBruto = parseFloat(montoBrutoRaw)
  if (isNaN(montoBruto) || montoBruto <= 0) {
    return fail('El monto bruto debe ser mayor a 0')
  }

  const deducciones = deduccionesRaw ? parseFloat(deduccionesRaw) : 0
  const aportesPatronales = aportesPatronalesRaw ? parseFloat(aportesPatronalesRaw) : 0
  const bonificaciones = bonificacionesRaw ? parseFloat(bonificacionesRaw) : 0
  const montoNeto = montoBruto - deducciones + bonificaciones

  // Parsear conceptos JSON
  let conceptos: unknown = []
  if (conceptosRaw) {
    try {
      conceptos = JSON.parse(conceptosRaw)
    } catch {
      return fail('El formato de conceptos no es válido')
    }
  }

  // Obtener persona_id desde el contrato
  const { data: contrato, error: contratoError } = await supabase
    .from('rrhh_contratos')
    .select('persona_id, moneda')
    .eq('id', contratoId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (contratoError || !contrato) {
    return fail('Contrato no encontrado')
  }

  const { data, error } = await supabase
    .from('rrhh_liquidaciones')
    .insert({
      tenant_id: TENANT_ID,
      contrato_id: contratoId,
      persona_id: contrato.persona_id,
      periodo,
      monto_bruto: montoBruto,
      deducciones,
      aportes_patronales: aportesPatronales,
      bonificaciones,
      monto_neto: montoNeto,
      moneda: contrato.moneda,
      conceptos,
      observaciones: observaciones || null,
      estado: 'borrador',
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una liquidación para este contrato en el período ${periodo}`)
    }
    return fail(`Error al crear liquidación: ${error.message}`)
  }

  revalidatePath('/admin/rrhh')
  return ok(data)
}

export async function aprobarLiquidacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener liquidación
  const { data: liquidacion, error: fetchError } = await supabase
    .from('rrhh_liquidaciones')
    .select('id, estado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !liquidacion) {
    return fail('Liquidación no encontrada')
  }

  if (liquidacion.estado !== 'borrador') {
    return fail(`No se puede aprobar una liquidación en estado "${liquidacion.estado}"`)
  }

  // Obtener persona actual para registrar quién aprobó
  let aprobadaPorId: string | null = null
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    aprobadaPorId = persona?.id ?? null
  }

  const { error } = await supabase
    .from('rrhh_liquidaciones')
    .update({
      estado: 'aprobada',
      aprobada_at: new Date().toISOString(),
      aprobada_por_id: aprobadaPorId,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al aprobar liquidación: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}

export async function pagarLiquidacion(id: string, cajaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener liquidación con datos del contrato y persona
  const { data: liquidacion, error: fetchError } = await supabase
    .from('rrhh_liquidaciones')
    .select(`
      *,
      contrato:rrhh_contratos(id, puesto),
      persona:personas!rrhh_liquidaciones_persona_id_fkey(id, nombre, apellido)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !liquidacion) {
    return fail('Liquidación no encontrada')
  }

  if (liquidacion.estado !== 'aprobada') {
    return fail(`Solo se pueden pagar liquidaciones aprobadas (estado actual: "${liquidacion.estado}")`)
  }

  const hoy = new Date().toISOString().split('T')[0]

  // Armar nombre para descripción (FK join devuelve array)
  const personaArr = liquidacion.persona as unknown as { id: string; nombre: string; apellido: string }[]
  const personaNombre = personaArr?.[0]
    ? `${personaArr[0].apellido}, ${personaArr[0].nombre}`
    : 'Empleado'

  // Crear movimiento de egreso (patrón cobrarCuota)
  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_caja')
    .insert({
      tenant_id: TENANT_ID,
      caja_id: cajaId,
      tipo: 'egreso',
      monto_bruto: liquidacion.monto_neto,
      monto_neto: liquidacion.monto_neto,
      moneda: liquidacion.moneda,
      persona_id: liquidacion.persona_id,
      fecha: hoy,
      descripcion: `Liquidación ${liquidacion.periodo} - ${personaNombre}`,
    })
    .select('id, numero')
    .single()

  if (movError) return fail(`Error al crear movimiento: ${movError.message}`)

  // Actualizar liquidación como pagada
  const { error: updateError } = await supabase
    .from('rrhh_liquidaciones')
    .update({
      estado: 'pagada',
      movimiento_caja_id: movimiento.id,
      caja_id: cajaId,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (updateError) return fail(`Error al actualizar liquidación: ${updateError.message}`)

  revalidatePath('/admin/rrhh')
  return ok({ movimiento_id: movimiento.id, movimiento_numero: movimiento.numero })
}

export async function anularLiquidacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: liquidacion, error: fetchError } = await supabase
    .from('rrhh_liquidaciones')
    .select('id, estado, movimiento_caja_id')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !liquidacion) {
    return fail('Liquidación no encontrada')
  }

  if (liquidacion.estado === 'anulada') {
    return fail('La liquidación ya está anulada')
  }

  // Si tiene movimiento de caja asociado, anularlo también
  if (liquidacion.movimiento_caja_id) {
    // Obtener persona actual para registrar quién anuló el movimiento
    let anuladorId: string | null = null
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: persona } = await supabase
        .from('personas')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      anuladorId = persona?.id ?? null
    }

    const { error: movError } = await supabase
      .from('movimientos_caja')
      .update({
        anulado: true,
        anulado_por_id: anuladorId,
        anulado_at: new Date().toISOString(),
        motivo_anulacion: 'Anulación de liquidación asociada',
      })
      .eq('id', liquidacion.movimiento_caja_id)
      .eq('tenant_id', TENANT_ID)

    if (movError) return fail(`Error al anular movimiento asociado: ${movError.message}`)
  }

  const { error } = await supabase
    .from('rrhh_liquidaciones')
    .update({ estado: 'anulada' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al anular liquidación: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}

export async function eliminarLiquidacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: liquidacion, error: fetchError } = await supabase
    .from('rrhh_liquidaciones')
    .select('id, estado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !liquidacion) {
    return fail('Liquidación no encontrada')
  }

  if (liquidacion.estado !== 'borrador') {
    return fail('Solo se pueden eliminar liquidaciones en estado borrador')
  }

  const { error } = await supabase
    .from('rrhh_liquidaciones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar liquidación: ${error.message}`)

  revalidatePath('/admin/rrhh')
  return ok()
}
