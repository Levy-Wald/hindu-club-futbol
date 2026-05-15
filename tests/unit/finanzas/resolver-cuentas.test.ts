import { describe, it, expect } from 'vitest'
import {
  validarTipoUsoVsSigno,
  resolverCuentasPuro,
  type ProductoCuentas,
  type CajaCuenta,
} from '../../../modules/finanzas/lib/contabilidad-rules'

const cajaCuenta: CajaCuenta = {
  cuenta_id: 'caja-001',
  cuenta_nombre: '1.1.1.01 - Caja Efectivo',
}

describe('validarTipoUsoVsSigno', () => {
  it('venta_servicio + ingreso => valid', () => {
    expect(validarTipoUsoVsSigno('venta_servicio', 'ingreso').valid).toBe(true)
  })

  it('uso_interno_consumo + ingreso => invalid (no puede generar ingresos)', () => {
    const result = validarTipoUsoVsSigno('uso_interno_consumo', 'ingreso')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('uso_interno_consumo')
  })

  it('uso_interno_consumo + egreso => valid', () => {
    expect(validarTipoUsoVsSigno('uso_interno_consumo', 'egreso').valid).toBe(true)
  })

  it('null tipo_uso + ingreso => valid (fallback)', () => {
    expect(validarTipoUsoVsSigno(null, 'ingreso').valid).toBe(true)
  })
})

describe('resolverCuentasPuro', () => {
  it('caso 1: venta_servicio + ingreso => debe=caja, haber=ingreso_servicio', () => {
    const producto: ProductoCuentas = {
      tipo_uso: 'venta_servicio',
      cuenta_ingreso_id: 'ing-001',
      cuenta_egreso_id: null,
      cuenta_ingreso_nombre: '4.1.1.01 - Ingresos Servicios',
      cuenta_egreso_nombre: null,
    }
    const result = resolverCuentasPuro(producto, cajaCuenta, 'ingreso')
    expect(result.cuenta_debe_id).toBe('caja-001')
    expect(result.cuenta_haber_id).toBe('ing-001')
    expect(result.warnings).toHaveLength(0)
  })

  it('caso 2: venta_bien_revend + ingreso => debe=caja, haber=ingreso_ventas', () => {
    const producto: ProductoCuentas = {
      tipo_uso: 'venta_bien_revend',
      cuenta_ingreso_id: 'ing-002',
      cuenta_egreso_id: null,
      cuenta_ingreso_nombre: '4.1.2.01 - Ingresos Ventas',
      cuenta_egreso_nombre: null,
    }
    const result = resolverCuentasPuro(producto, cajaCuenta, 'ingreso')
    expect(result.cuenta_debe_id).toBe('caja-001')
    expect(result.cuenta_haber_id).toBe('ing-002')
    expect(result.warnings).toHaveLength(0)
  })

  it('caso 3: compra_insumo + egreso => debe=gasto, haber=caja', () => {
    const producto: ProductoCuentas = {
      tipo_uso: 'compra_insumo',
      cuenta_ingreso_id: null,
      cuenta_egreso_id: 'egr-001',
      cuenta_ingreso_nombre: null,
      cuenta_egreso_nombre: '5.1.1.01 - Gastos Insumos',
    }
    const result = resolverCuentasPuro(producto, cajaCuenta, 'egreso')
    expect(result.cuenta_debe_id).toBe('egr-001')
    expect(result.cuenta_haber_id).toBe('caja-001')
    expect(result.warnings).toHaveLength(0)
  })

  it('caso 4: producto sin cuenta de ingreso => warning', () => {
    const producto: ProductoCuentas = {
      tipo_uso: 'venta_servicio',
      cuenta_ingreso_id: null,
      cuenta_egreso_id: null,
      cuenta_ingreso_nombre: null,
      cuenta_egreso_nombre: null,
    }
    const result = resolverCuentasPuro(producto, cajaCuenta, 'ingreso')
    expect(result.cuenta_debe_id).toBe('caja-001')
    expect(result.cuenta_haber_id).toBeNull()
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('cuenta de ingreso')
  })

  it('caso 5: uso_interno + ingreso => bloqueado', () => {
    const producto: ProductoCuentas = {
      tipo_uso: 'uso_interno_consumo',
      cuenta_ingreso_id: 'ing-001',
      cuenta_egreso_id: 'egr-001',
      cuenta_ingreso_nombre: 'Ingreso',
      cuenta_egreso_nombre: 'Egreso',
    }
    const result = resolverCuentasPuro(producto, cajaCuenta, 'ingreso')
    expect(result.cuenta_debe_id).toBeNull()
    expect(result.cuenta_haber_id).toBeNull()
    expect(result.warnings[0]).toContain('uso_interno_consumo')
  })
})
