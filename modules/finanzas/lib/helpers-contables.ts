'use server'

import { createClient } from '@/lib/supabase/server'

export interface CuentasResueltas {
  cuenta_debe_id: string | null
  cuenta_haber_id: string | null
  cuenta_debe_nombre: string | null
  cuenta_haber_nombre: string | null
  warnings: string[]
}

/**
 * Dada una combinación producto + signo de movimiento, resuelve qué cuentas
 * contables corresponden según el tipo_uso del producto.
 *
 * INGRESO: debe=caja.cuenta_id, haber=producto.cuenta_ingreso_id
 * EGRESO:  debe=producto.cuenta_egreso_id, haber=caja.cuenta_id
 *
 * uso_interno_* no puede generar ingresos (warning bloqueante).
 */
export async function resolverCuentasMovimiento(input: {
  producto_id: string
  signo: 'ingreso' | 'egreso'
  caja_id: string
}): Promise<CuentasResueltas> {
  const supabase = await createClient()

  // 1. Traer producto con cuentas
  const { data: producto, error: errProd } = await supabase
    .from('productos')
    .select(`
      tipo_uso,
      cuenta_ingreso_id,
      cuenta_egreso_id,
      cuenta_ingreso:plan_cuentas!cuenta_ingreso_id(id, codigo, nombre),
      cuenta_egreso:plan_cuentas!cuenta_egreso_id(id, codigo, nombre)
    `)
    .eq('id', input.producto_id)
    .single()

  if (errProd || !producto) {
    return {
      cuenta_debe_id: null, cuenta_haber_id: null,
      cuenta_debe_nombre: null, cuenta_haber_nombre: null,
      warnings: ['Producto no encontrado'],
    }
  }

  // 2. Traer cuenta de la caja
  const { data: caja } = await supabase
    .from('cajas')
    .select(`
      cuenta_id,
      cuenta:plan_cuentas!cuenta_id(id, codigo, nombre)
    `)
    .eq('id', input.caja_id)
    .single()

  const warnings: string[] = []
  const cajaCuentaId = caja?.cuenta_id ?? null
  const cajaCuentaRaw = caja?.cuenta as unknown
  const cajaCuenta = (Array.isArray(cajaCuentaRaw) ? cajaCuentaRaw[0] : cajaCuentaRaw) as { id: string; codigo: string; nombre: string } | null
  const cajaCuentaNombre = cajaCuenta ? `${cajaCuenta.codigo} - ${cajaCuenta.nombre}` : null

  if (!cajaCuentaId) {
    warnings.push('La caja no tiene cuenta contable asociada. Asignala desde /finanzas/cajas.')
  }

  // 3. Validar tipo_uso vs signo
  if (input.signo === 'ingreso' && producto.tipo_uso?.startsWith('uso_interno')) {
    return {
      cuenta_debe_id: null, cuenta_haber_id: null,
      cuenta_debe_nombre: null, cuenta_haber_nombre: null,
      warnings: [
        `Este producto es de "${producto.tipo_uso}" y no deberia generar ingresos. Verifica el tipo de uso del producto.`,
      ],
    }
  }

  // Parse FK joins
  const cuentaIngresoRaw = producto.cuenta_ingreso as unknown
  const cuentaIngreso = (Array.isArray(cuentaIngresoRaw) ? cuentaIngresoRaw[0] : cuentaIngresoRaw) as { id: string; codigo: string; nombre: string } | null
  const cuentaEgresoRaw = producto.cuenta_egreso as unknown
  const cuentaEgreso = (Array.isArray(cuentaEgresoRaw) ? cuentaEgresoRaw[0] : cuentaEgresoRaw) as { id: string; codigo: string; nombre: string } | null

  // 4. Resolver según signo
  if (input.signo === 'ingreso') {
    if (!producto.cuenta_ingreso_id) {
      warnings.push('El producto no tiene cuenta de ingreso configurada. Asignala desde /admin/productos.')
    }
    return {
      cuenta_debe_id: cajaCuentaId,
      cuenta_haber_id: producto.cuenta_ingreso_id,
      cuenta_debe_nombre: cajaCuentaNombre,
      cuenta_haber_nombre: cuentaIngreso ? `${cuentaIngreso.codigo} - ${cuentaIngreso.nombre}` : null,
      warnings,
    }
  } else {
    if (!producto.cuenta_egreso_id) {
      warnings.push('El producto no tiene cuenta de egreso configurada. Asignala desde /admin/productos.')
    }
    return {
      cuenta_debe_id: producto.cuenta_egreso_id,
      cuenta_haber_id: cajaCuentaId,
      cuenta_debe_nombre: cuentaEgreso ? `${cuentaEgreso.codigo} - ${cuentaEgreso.nombre}` : null,
      cuenta_haber_nombre: cajaCuentaNombre,
      warnings,
    }
  }
}

/**
 * Preview: misma lógica que resolverCuentasMovimiento pero callable desde UI
 * para mostrar feedback antes de guardar.
 */
export async function previewCuentasMovimiento(input: {
  producto_id: string
  signo: 'ingreso' | 'egreso'
  caja_id: string
}): Promise<CuentasResueltas> {
  return resolverCuentasMovimiento(input)
}
