'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

const TIPOS_CENTRO = [
  'general', 'area', 'disciplina', 'equipo', 'sede', 'evento', 'comercial', 'ingreso', 'otro',
] as const

// -------------------------------------------------------------------
// Listar centros de costo (con stats de la vista)
// -------------------------------------------------------------------

export async function listarCentrosCosto(filtros?: {
  tipo?: string
  activo?: string // 'true' | 'false' | 'todos'
  busqueda?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('v_centros_costo_stats')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (filtros?.tipo && filtros.tipo !== 'todos') {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros?.activo === 'true') {
    query = query.eq('activo', true)
  } else if (filtros?.activo === 'false') {
    query = query.eq('activo', false)
  }
  if (filtros?.busqueda) {
    const q = `%${filtros.busqueda}%`
    query = query.or(`nombre.ilike.${q},codigo.ilike.${q}`)
  }

  const { data, error } = await query
  if (error) {
    console.error('listarCentrosCosto error:', error.message)
    return []
  }
  return data ?? []
}

// -------------------------------------------------------------------
// Obtener centro con stats
// -------------------------------------------------------------------

export async function obtenerCentroConStats(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_centros_costo_stats')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

// -------------------------------------------------------------------
// Crear centro de costo
// -------------------------------------------------------------------

interface CrearCentroInput {
  nombre: string
  codigo: string
  tipo: string
  padre_id: string | null
  referencia_tipo: string | null
  referencia_id: string | null
  descripcion: string | null
  activo: boolean
}

export async function crearCentroCosto(input: CrearCentroInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) return formatResult(false, 'El nombre es obligatorio')
  if (!input.codigo.trim()) return formatResult(false, 'El codigo es obligatorio')
  if (!TIPOS_CENTRO.includes(input.tipo as typeof TIPOS_CENTRO[number])) {
    return formatResult(false, 'Tipo invalido')
  }

  const codigo = input.codigo.trim().toUpperCase()

  const esUnico = await validarCodigoUnico(codigo)
  if (!esUnico) return formatResult(false, `El codigo "${codigo}" ya esta en uso`)

  if (input.padre_id) {
    const { data: padre } = await supabase
      .from('centros_costo')
      .select('id')
      .eq('id', input.padre_id)
      .eq('tenant_id', TENANT_ID)
      .single()
    if (!padre) return formatResult(false, 'Centro padre no encontrado')
  }

  const { data, error } = await supabase
    .from('centros_costo')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      codigo,
      tipo: input.tipo,
      padre_id: input.padre_id || null,
      referencia_tipo: input.referencia_tipo || null,
      referencia_id: input.referencia_id || null,
      activo: input.activo,
      metadata: input.descripcion ? { descripcion: input.descripcion.trim() } : {},
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('centros_costo_tenant_id_codigo_key')) {
      return formatResult(false, `El codigo "${codigo}" ya esta en uso`)
    }
    return formatResult(false, `Error al crear: ${error.message}`)
  }

  revalidatePath('/admin/[tenant]/finanzas/centros-costo', 'page')
  return formatResult(true, 'Centro de costo creado', { id: data.id })
}

// -------------------------------------------------------------------
// Editar centro de costo
// -------------------------------------------------------------------

interface EditarCentroInput {
  nombre: string
  tipo: string
  padre_id: string | null
  referencia_tipo: string | null
  referencia_id: string | null
  descripcion: string | null
  activo: boolean
}

export async function editarCentroCosto(id: string, input: EditarCentroInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) return formatResult(false, 'El nombre es obligatorio')

  if (input.padre_id) {
    if (input.padre_id === id) return formatResult(false, 'Un centro no puede ser su propio padre')
    const descendientes = await listarDescendientes(id)
    if (descendientes.includes(input.padre_id)) {
      return formatResult(false, 'No se puede asignar como padre a un descendiente (crearia un ciclo)')
    }
  }

  const { error } = await supabase
    .from('centros_costo')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      padre_id: input.padre_id || null,
      referencia_tipo: input.referencia_tipo || null,
      referencia_id: input.referencia_id || null,
      activo: input.activo,
      metadata: input.descripcion ? { descripcion: input.descripcion.trim() } : {},
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, `Error al editar: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas/centros-costo', 'page')
  revalidatePath(`/admin/finanzas/centros-costo/${id}`)
  return formatResult(true, 'Centro actualizado')
}

// -------------------------------------------------------------------
// Dar de baja (soft delete)
// -------------------------------------------------------------------

export async function darDeBajaCentroCosto(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('centros_costo')
    .update({ activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, `Error: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas/centros-costo', 'page')
  return formatResult(true, 'Centro dado de baja')
}

// -------------------------------------------------------------------
// Reactivar
// -------------------------------------------------------------------

export async function reactivarCentroCosto(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('centros_costo')
    .update({ activo: true })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, `Error: ${error.message}`)

  revalidatePath('/admin/[tenant]/finanzas/centros-costo', 'page')
  return formatResult(true, 'Centro reactivado')
}

// -------------------------------------------------------------------
// Validar codigo unico
// -------------------------------------------------------------------

export async function validarCodigoUnico(codigo: string, idExcluir?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('centros_costo')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('codigo', codigo.trim().toUpperCase())

  if (idExcluir) query = query.neq('id', idExcluir)

  const { count } = await query
  return (count ?? 0) === 0
}

// -------------------------------------------------------------------
// Listar descendientes (para evitar ciclos)
// -------------------------------------------------------------------

export async function listarDescendientes(id: string): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('centros_costo')
    .select('id, padre_id')
    .eq('tenant_id', TENANT_ID)

  if (!data) return []

  const hijos = new Map<string, string[]>()
  for (const cc of data) {
    if (cc.padre_id) {
      const arr = hijos.get(cc.padre_id) || []
      arr.push(cc.id)
      hijos.set(cc.padre_id, arr)
    }
  }

  const result: string[] = []
  const queue = hijos.get(id) || []
  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)
    const children = hijos.get(current) || []
    queue.push(...children)
  }

  return result
}

// -------------------------------------------------------------------
// Listar movimientos por centro
// -------------------------------------------------------------------

export async function listarMovimientosPorCentro(centroId: string, filtros?: {
  tipo?: string
  fecha_desde?: string
  fecha_hasta?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('movimientos_caja')
    .select(`
      id, tipo, monto_bruto, monto_neto, fecha, descripcion, anulado,
      comprobante_numero, created_at,
      cajas(nombre),
      medios_pago(nombre),
      personas(nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('centro_costo_id', centroId)
    .order('fecha', { ascending: false })
    .limit(200)

  if (filtros?.tipo && filtros.tipo !== 'todos') query = query.eq('tipo', filtros.tipo)
  if (filtros?.fecha_desde) query = query.gte('fecha', filtros.fecha_desde)
  if (filtros?.fecha_hasta) query = query.lte('fecha', filtros.fecha_hasta)

  const { data, error } = await query
  if (error) {
    console.error('listarMovimientosPorCentro error:', error.message)
    return []
  }
  return data ?? []
}

// -------------------------------------------------------------------
// Listar productos por centro
// -------------------------------------------------------------------

export async function listarProductosPorCentro(centroId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, tipo, precio_base, moneda, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('centro_costo_id', centroId)
    .order('nombre')

  if (error) return []
  return data ?? []
}

// -------------------------------------------------------------------
// Listar sub-centros
// -------------------------------------------------------------------

export async function listarSubcentros(padreId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_centros_costo_stats')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('padre_id', padreId)
    .order('nombre')

  if (error) return []
  return data ?? []
}
