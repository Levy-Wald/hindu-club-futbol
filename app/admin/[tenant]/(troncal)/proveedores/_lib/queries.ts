// F1.13 — Proveedores (UI gestor MVP). Un proveedor ES una `entidad` con
// tipo='proveedor'. Estas queries son específicas del gestor de proveedores:
// suman saldo de cuenta corriente y cantidad de productos asociados.
import { createClient } from '@/lib/supabase/server'

export interface FetchProveedoresParams {
  search?: string
  activo?: string
}

export interface ProveedorRow {
  id: string
  nombre: string
  cuit: string | null
  razon_social: string | null
  telefono: string | null
  email: string | null
  sitio_web: string | null
  activo: boolean
  saldo: number
  productos_count: number
}

export async function fetchProveedores(params: FetchProveedoresParams = {}): Promise<ProveedorRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('entidades')
    .select('id, nombre, cuit, razon_social, telefono, email, sitio_web, activo')
    .eq('tipo', 'proveedor')
    .is('deleted_at', null)
    .order('nombre')

  if (params.search) {
    query = query.or(`nombre.ilike.%${params.search}%,email.ilike.%${params.search}%,cuit.ilike.%${params.search}%`)
  }
  if (params.activo === 'activo') {
    query = query.eq('activo', true)
  } else if (params.activo === 'inactivo') {
    query = query.eq('activo', false)
  }

  const { data, error } = await query
  if (error) throw error

  const proveedores = data ?? []
  if (proveedores.length === 0) return []

  const ids = proveedores.map((p) => p.id)

  // Saldos de cuenta corriente (entidad_id) y conteo de productos asociados,
  // en dos lecturas planas para evitar ambigüedad de embeddings.
  const [{ data: cuentas }, { data: vinculos }] = await Promise.all([
    supabase.from('cuentas_corrientes').select('entidad_id, saldo').in('entidad_id', ids),
    supabase
      .from('producto_proveedores')
      .select('proveedor_entidad_id')
      .in('proveedor_entidad_id', ids)
      .is('deleted_at', null),
  ])

  const saldoPorEntidad = new Map<string, number>()
  for (const c of cuentas ?? []) {
    saldoPorEntidad.set(c.entidad_id as string, (saldoPorEntidad.get(c.entidad_id as string) ?? 0) + Number(c.saldo ?? 0))
  }
  const productosPorEntidad = new Map<string, number>()
  for (const v of vinculos ?? []) {
    const k = v.proveedor_entidad_id as string
    productosPorEntidad.set(k, (productosPorEntidad.get(k) ?? 0) + 1)
  }

  return proveedores.map((p) => ({
    ...p,
    saldo: saldoPorEntidad.get(p.id) ?? 0,
    productos_count: productosPorEntidad.get(p.id) ?? 0,
  }))
}

export async function fetchProveedorDetalle(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'proveedor')
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export interface CuentaCorrienteProveedor {
  saldo: number
  saldo_usd: number
  activa: boolean
  ultimo_movimiento_at: string | null
}

export async function fetchProveedorCuentaCorriente(id: string): Promise<CuentaCorrienteProveedor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuentas_corrientes')
    .select('saldo, saldo_usd, activa, ultimo_movimiento_at')
    .eq('entidad_id', id)
    .order('ultimo_movimiento_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    saldo: Number(data.saldo ?? 0),
    saldo_usd: Number(data.saldo_usd ?? 0),
    activa: data.activa ?? false,
    ultimo_movimiento_at: data.ultimo_movimiento_at,
  }
}

export interface ProductoProveedorRow {
  id: string
  sku_proveedor: string | null
  precio_compra: number | null
  moneda: string | null
  moq: number | null
  plazo_entrega_dias: number | null
  es_principal: boolean
  activo: boolean
  producto: { id: string; nombre: string; sku: string | null; activo: boolean } | null
}

export async function fetchProveedorProductos(id: string): Promise<ProductoProveedorRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('producto_proveedores')
    .select(
      'id, sku_proveedor, precio_compra, moneda, moq, plazo_entrega_dias, es_principal, activo, producto:productos!producto_id(id, nombre, sku, activo)',
    )
    .eq('proveedor_entidad_id', id)
    .is('deleted_at', null)
    .order('es_principal', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    producto: (r.producto as unknown as ProductoProveedorRow['producto']) ?? null,
  }))
}
