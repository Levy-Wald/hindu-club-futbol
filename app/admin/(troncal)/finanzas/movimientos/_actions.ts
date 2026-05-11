'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(success: boolean, error?: string) {
  return { success, error }
}

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
    return formatResult(false, 'Tipo de movimiento invalido')
  }
  if (!cajaId) {
    return formatResult(false, 'Debe seleccionar una caja')
  }
  if (tipo === 'transferencia' && !cajaDestinoId) {
    return formatResult(false, 'Debe seleccionar una caja destino para la transferencia')
  }
  if (montoBruto <= 0) {
    return formatResult(false, 'El monto bruto debe ser mayor a cero')
  }
  if (!fecha) {
    return formatResult(false, 'Debe indicar una fecha')
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
    return formatResult(false, `Error al crear movimiento: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/movimientos')
  revalidatePath('/admin/finanzas/cajas')
  return formatResult(true)
}

export async function anularMovimiento(id: string, motivo: string) {
  const supabase = await createClient()

  if (!id) {
    return formatResult(false, 'ID de movimiento requerido')
  }
  if (!motivo || !motivo.trim()) {
    return formatResult(false, 'Debe indicar un motivo de anulacion')
  }

  // Verify the movement exists and is not already voided
  const { data: movimiento, error: fetchError } = await supabase
    .from('movimientos_caja')
    .select('id, anulado')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !movimiento) {
    return formatResult(false, 'Movimiento no encontrado')
  }

  if (movimiento.anulado) {
    return formatResult(false, 'El movimiento ya esta anulado')
  }

  // Update anulado = true
  // The DB trigger reverses saldo and cuenta corriente
  const { error } = await supabase
    .from('movimientos_caja')
    .update({
      anulado: true,
      anulado_at: new Date().toISOString(),
      motivo_anulacion: motivo.trim(),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al anular movimiento: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/movimientos')
  revalidatePath('/admin/finanzas/cajas')
  return formatResult(true)
}
