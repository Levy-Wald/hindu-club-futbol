/**
 * Pure business rules for contabilidad resolution.
 * Extracted from helpers-contables.ts for testability.
 */

export interface ProductoCuentas {
  tipo_uso: string | null
  cuenta_ingreso_id: string | null
  cuenta_egreso_id: string | null
  cuenta_ingreso_nombre: string | null
  cuenta_egreso_nombre: string | null
}

export interface CajaCuenta {
  cuenta_id: string | null
  cuenta_nombre: string | null
}

export interface CuentasResueltas {
  cuenta_debe_id: string | null
  cuenta_haber_id: string | null
  cuenta_debe_nombre: string | null
  cuenta_haber_nombre: string | null
  warnings: string[]
}

/**
 * Validates whether a tipo_uso is compatible with a movement sign.
 * uso_interno_* products cannot generate income.
 */
export function validarTipoUsoVsSigno(
  tipo_uso: string | null,
  signo: 'ingreso' | 'egreso'
): { valid: boolean; error?: string } {
  if (signo === 'ingreso' && tipo_uso?.startsWith('uso_interno')) {
    return {
      valid: false,
      error: `Este producto es de "${tipo_uso}" y no deberia generar ingresos. Verifica el tipo de uso del producto.`,
    }
  }
  return { valid: true }
}

/**
 * Resolves accounting accounts for a movement given producto cuentas, caja cuenta, and signo.
 * Pure function — no DB calls.
 *
 * INGRESO: debe=caja, haber=producto.cuenta_ingreso
 * EGRESO:  debe=producto.cuenta_egreso, haber=caja
 */
export function resolverCuentasPuro(
  producto: ProductoCuentas,
  caja: CajaCuenta,
  signo: 'ingreso' | 'egreso'
): CuentasResueltas {
  const warnings: string[] = []

  // Validate tipo_uso vs signo
  const validation = validarTipoUsoVsSigno(producto.tipo_uso, signo)
  if (!validation.valid) {
    return {
      cuenta_debe_id: null,
      cuenta_haber_id: null,
      cuenta_debe_nombre: null,
      cuenta_haber_nombre: null,
      warnings: [validation.error!],
    }
  }

  if (!caja.cuenta_id) {
    warnings.push('La caja no tiene cuenta contable asociada. Asignala desde /finanzas/cajas.')
  }

  if (signo === 'ingreso') {
    if (!producto.cuenta_ingreso_id) {
      warnings.push('El producto no tiene cuenta de ingreso configurada. Asignala desde /admin/productos.')
    }
    return {
      cuenta_debe_id: caja.cuenta_id,
      cuenta_haber_id: producto.cuenta_ingreso_id,
      cuenta_debe_nombre: caja.cuenta_nombre,
      cuenta_haber_nombre: producto.cuenta_ingreso_nombre,
      warnings,
    }
  } else {
    if (!producto.cuenta_egreso_id) {
      warnings.push('El producto no tiene cuenta de egreso configurada. Asignala desde /admin/productos.')
    }
    return {
      cuenta_debe_id: producto.cuenta_egreso_id,
      cuenta_haber_id: caja.cuenta_id,
      cuenta_debe_nombre: producto.cuenta_egreso_nombre,
      cuenta_haber_nombre: caja.cuenta_nombre,
      warnings,
    }
  }
}
