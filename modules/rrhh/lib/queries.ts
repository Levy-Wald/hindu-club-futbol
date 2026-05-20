'use server'

import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


// =============================================================================
// Dashboard RRHH
// =============================================================================

export async function fetchDashboardRRHH() {
  const supabase = await createClient()

  // Total empleados activos (personas con atributo rrhh.empleado activo)
  const { count: totalEmpleados } = await supabase
    .from('personas_atributos')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('atributo_slug', 'rrhh.empleado')
    .eq('activo', true)

  // Contratos vigentes
  const { count: contratosVigentes } = await supabase
    .from('rrhh_contratos')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'vigente')
    .is('deleted_at', null)

  // Total costo mensual (sum de montos de contratos vigentes con frecuencia mensual)
  const { data: contratosParaCosto } = await supabase
    .from('rrhh_contratos')
    .select('monto, moneda, frecuencia')
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'vigente')
    .is('deleted_at', null)

  let costoMensualARS = 0
  let costoMensualUSD = 0
  for (const c of contratosParaCosto ?? []) {
    let montoMensual = Number(c.monto) || 0
    // Normalizar a mensual
    if (c.frecuencia === 'quincenal') montoMensual *= 2
    else if (c.frecuencia === 'semanal') montoMensual *= 4.33
    else if (c.frecuencia === 'por_hora') montoMensual *= 160 // estimado 40hs/semana * 4
    // por_evento no se suma al costo fijo

    if (c.frecuencia === 'por_evento') continue

    if (c.moneda === 'USD') {
      costoMensualUSD += montoMensual
    } else {
      costoMensualARS += montoMensual
    }
  }

  // Liquidaciones pendientes (borrador) del mes actual
  const ahora = new Date()
  const periodoActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

  const { count: liquidacionesPendientes } = await supabase
    .from('rrhh_liquidaciones')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('periodo', periodoActual)
    .in('estado', ['borrador', 'aprobada'])
    .is('deleted_at', null)

  return {
    totalEmpleados: totalEmpleados ?? 0,
    contratosVigentes: contratosVigentes ?? 0,
    costoMensualARS,
    costoMensualUSD,
    liquidacionesPendientes: liquidacionesPendientes ?? 0,
    periodoActual,
  }
}

// =============================================================================
// Empleados
// =============================================================================

export async function fetchEmpleados(filters?: {
  search?: string
  modalidad?: string
  estado_contrato?: string
}) {
  const supabase = await createClient()

  // Primero traer persona_ids que tienen atributo rrhh.empleado activo
  const { data: atributos } = await supabase
    .from('personas_atributos')
    .select('persona_id')
    .eq('tenant_id', TENANT_ID)
    .eq('atributo_slug', 'rrhh.empleado')
    .eq('activo', true)

  const personaIds = (atributos ?? []).map((a) => a.persona_id)
  if (personaIds.length === 0) return []

  // Traer personas
  let queryPersonas = supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, foto_perfil_url, email_principal, telefono_principal, cuil_cuit')
    .eq('tenant_id', TENANT_ID)
    .in('id', personaIds)
    .order('apellido')
    .order('nombre')

  if (filters?.search) {
    queryPersonas = queryPersonas.or(
      `nombre.ilike.%${filters.search}%,apellido.ilike.%${filters.search}%`
    )
  }

  const { data: personas } = await queryPersonas
  if (!personas || personas.length === 0) return []

  // Traer contratos vigentes de estos empleados
  let queryContratos = supabase
    .from('rrhh_contratos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .in('persona_id', personas.map((p) => p.id))

  // Si filtran por estado_contrato, usar ese; si no, solo vigentes
  if (filters?.estado_contrato) {
    queryContratos = queryContratos.eq('estado', filters.estado_contrato)
  } else {
    queryContratos = queryContratos.eq('estado', 'vigente')
  }

  if (filters?.modalidad) {
    queryContratos = queryContratos.eq('modalidad', filters.modalidad)
  }

  const { data: contratos } = await queryContratos

  // Combinar: cada persona con su contrato vigente
  const contratosPorPersona = new Map<string, typeof contratos>()
  for (const c of contratos ?? []) {
    if (!contratosPorPersona.has(c.persona_id)) {
      contratosPorPersona.set(c.persona_id, [])
    }
    contratosPorPersona.get(c.persona_id)!.push(c)
  }

  // Si hay filtros de contrato, solo devolver personas que tienen contrato que matchea
  if (filters?.modalidad || filters?.estado_contrato) {
    return personas
      .filter((p) => contratosPorPersona.has(p.id))
      .map((p) => ({
        ...p,
        contrato_vigente: contratosPorPersona.get(p.id)?.[0] ?? null,
      }))
  }

  return personas.map((p) => ({
    ...p,
    contrato_vigente: contratosPorPersona.get(p.id)?.[0] ?? null,
  }))
}

// =============================================================================
// Empleado Detalle
// =============================================================================

export async function fetchEmpleadoDetalle(personaId: string) {
  const supabase = await createClient()

  // Persona
  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (personaError) return null

  // Todos los contratos (incluido históricos)
  const { data: contratos } = await supabase
    .from('rrhh_contratos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .order('fecha_inicio', { ascending: false })

  // Todas las liquidaciones
  const { data: liquidaciones } = await supabase
    .from('rrhh_liquidaciones')
    .select(`
      *,
      contrato:rrhh_contratos(id, modalidad),
      aprobada_por:personas!rrhh_liquidaciones_aprobada_por_id_fkey(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .order('periodo', { ascending: false })

  return {
    persona,
    contratos: contratos ?? [],
    liquidaciones: liquidaciones ?? [],
  }
}

// =============================================================================
// Contratos
// =============================================================================

export async function fetchContratos(filters?: {
  search?: string
  modalidad?: string
  estado?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('rrhh_contratos')
    .select(`
      *,
      persona:personas(id, nombre, apellido, numero_documento, foto_perfil_url)
    `)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('fecha_inicio', { ascending: false })

  if (filters?.modalidad) {
    query = query.eq('modalidad', filters.modalidad)
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  const { data, error } = await query
  if (error) return []

  let result = data ?? []

  // Filtro de search por nombre/apellido de persona (post-query)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    result = result.filter((c) => {
      const persona = c.persona as unknown as {
        id: string
        nombre: string
        apellido: string
        numero_documento: string
      } | null
      if (!persona) return false
      return (
        persona.nombre?.toLowerCase().includes(searchLower) ||
        persona.apellido?.toLowerCase().includes(searchLower) ||
        persona.numero_documento?.toLowerCase().includes(searchLower)
      )
    })
  }

  // Enrich with datos laborales
  const personaIds = [...new Set(result.map((c) => c.persona_id))]
  if (personaIds.length > 0) {
    const { data: datosLab } = await supabase
      .from('personas_datos_laborales')
      .select('persona_id, area_trabajo_slug, puesto_slug')
      .eq('tenant_id', TENANT_ID)
      .in('persona_id', personaIds)

    const labMap = new Map((datosLab ?? []).map((d) => [d.persona_id, d]))
    result = result.map((c) => ({
      ...c,
      datos_laborales: labMap.get(c.persona_id) ?? null,
    }))
  }

  return result
}

export async function fetchContratoDetalle(contratoId: string) {
  const supabase = await createClient()

  // Contrato con persona
  const { data: contrato, error: contratoError } = await supabase
    .from('rrhh_contratos')
    .select(`
      *,
      persona:personas(id, nombre, apellido, numero_documento, foto_perfil_url, email_principal, telefono_principal, cuil_cuit)
    `)
    .eq('id', contratoId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .single()

  if (contratoError) return null

  // Datos laborales de la persona + liquidaciones en paralelo
  const [{ data: datosLab }, { data: liquidaciones }] = await Promise.all([
    supabase
      .from('personas_datos_laborales')
      .select('*, area:catalogo_areas_trabajo(slug, nombre), puesto:catalogo_puestos(slug, nombre), rol:catalogo_roles_laborales(slug, nombre), obra_social:catalogo_obras_sociales(slug, nombre)')
      .eq('persona_id', contrato.persona_id)
      .eq('tenant_id', TENANT_ID)
      .maybeSingle(),
    supabase
      .from('rrhh_liquidaciones')
      .select(`
        *,
        aprobada_por:personas!rrhh_liquidaciones_aprobada_por_id_fkey(id, nombre, apellido)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('contrato_id', contratoId)
      .is('deleted_at', null)
      .order('periodo', { ascending: false }),
  ])

  return {
    ...contrato,
    datos_laborales: datosLab ?? null,
    liquidaciones: liquidaciones ?? [],
  }
}

// =============================================================================
// Liquidaciones
// =============================================================================

export async function fetchLiquidaciones(filters?: {
  periodo?: string
  estado?: string
  persona_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('rrhh_liquidaciones')
    .select(`
      *,
      contrato:rrhh_contratos(id, modalidad),
      persona:personas!rrhh_liquidaciones_persona_id_fkey(id, nombre, apellido, numero_documento, foto_perfil_url),
      aprobada_por:personas!rrhh_liquidaciones_aprobada_por_id_fkey(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('periodo', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.periodo) {
    query = query.eq('periodo', filters.periodo)
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }
  if (filters?.persona_id) {
    query = query.eq('persona_id', filters.persona_id)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchLiquidacionDetalle(liquidacionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rrhh_liquidaciones')
    .select(`
      *,
      contrato:rrhh_contratos(id, modalidad, categoria_convenio, monto, moneda, frecuencia),
      persona:personas!rrhh_liquidaciones_persona_id_fkey(id, nombre, apellido, numero_documento, foto_perfil_url, email_principal, cuil_cuit),
      aprobada_por:personas!rrhh_liquidaciones_aprobada_por_id_fkey(id, nombre, apellido)
    `)
    .eq('id', liquidacionId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data
}

// =============================================================================
// Auxiliares
// =============================================================================

export async function fetchCajasParaLiquidacion() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cajas')
    .select('id, nombre, tipo, moneda, saldo_actual')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .order('nombre')

  if (error) return []
  return data ?? []
}

export async function fetchPersonasParaContrato() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, cuil_cuit')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .order('nombre')

  if (error) return []
  return data ?? []
}

// =============================================================================
// Buscar personas (autocomplete para selector de contrato)
// =============================================================================

export async function buscarPersonasRRHH(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, cuil_cuit')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,numero_documento.ilike.%${query}%`)
    .order('apellido')
    .limit(15)

  if (error) return []
  return data ?? []
}

// =============================================================================
// Datos laborales de una persona
// =============================================================================

export async function fetchDatosLaborales(personaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas_datos_laborales')
    .select(`
      *,
      area:catalogo_areas_trabajo(slug, nombre),
      puesto:catalogo_puestos(slug, nombre),
      rol:catalogo_roles_laborales(slug, nombre),
      obra_social:catalogo_obras_sociales(slug, nombre)
    `)
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (error) return null
  return data
}

// =============================================================================
// Catálogos laborales (para selects en forms)
// =============================================================================

export async function fetchCatalogosLaborales() {
  const supabase = await createClient()

  const [areas, puestos, roles, obrasSociales] = await Promise.all([
    supabase.from('catalogo_areas_trabajo').select('slug, nombre').eq('activo', true).order('nombre'),
    supabase.from('catalogo_puestos').select('slug, nombre').eq('activo', true).order('nombre'),
    supabase.from('catalogo_roles_laborales').select('slug, nombre').eq('activo', true).order('nombre'),
    supabase.from('catalogo_obras_sociales').select('slug, nombre').eq('activo', true).order('nombre'),
  ])

  return {
    areas: areas.data ?? [],
    puestos: puestos.data ?? [],
    roles: roles.data ?? [],
    obrasSociales: obrasSociales.data ?? [],
  }
}
