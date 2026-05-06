import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

export interface PadronConConteo {
  id: string
  nombre: string
  slug: string
  tipo: string | null
  disciplina_slug: string | null
  es_externo: boolean
  activo: boolean
  created_at: string
  miembros_activos: number
}

export interface FetchPadronesParams {
  search?: string
  tipo?: string
  activo?: string
}

export async function fetchPadronesConConteo(params: FetchPadronesParams = {}): Promise<PadronConConteo[]> {
  const supabase = await createClient()

  let query = supabase
    .from('padrones')
    .select(`
      id, nombre, slug, tipo, disciplina_slug, es_externo, activo, created_at,
      personas_padrones!personas_padrones_padron_id_fkey(id)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  if (params.search) {
    query = query.ilike('nombre', `%${params.search}%`)
  }
  if (params.tipo) {
    query = query.eq('tipo', params.tipo)
  }
  if (params.activo === 'activo') {
    query = query.eq('activo', true)
  } else if (params.activo === 'inactivo') {
    query = query.eq('activo', false)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    tipo: p.tipo,
    disciplina_slug: p.disciplina_slug,
    es_externo: p.es_externo,
    activo: p.activo,
    created_at: p.created_at,
    miembros_activos: Array.isArray(p.personas_padrones) ? p.personas_padrones.length : 0,
  }))
}

export interface MiembroPadron {
  id: string
  persona_id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  estado_padron: string | null
  tipo_socio: string | null
  numero_socio: string | null
  fecha_alta: string | null
  activo: boolean
}

export interface PadronDetalle {
  id: string
  nombre: string
  slug: string
  tipo: string | null
  es_externo: boolean
  activo: boolean
  fuente_externa: string | null
  created_at: string
  miembros: MiembroPadron[]
}

export async function fetchPadronDetalle(id: string): Promise<PadronDetalle> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('padrones')
    .select(`
      id, nombre, slug, tipo, es_externo, activo, fuente_externa, created_at,
      personas_padrones!personas_padrones_padron_id_fkey(
        id, persona_id, numero_socio, fecha_alta, activo,
        persona:personas!personas_padrones_persona_id_fkey(id, nombre, apellido, numero_documento),
        estado:catalogo_estados_padron!personas_padrones_estado_padron_id_fkey(nombre),
        tipo_socio:catalogo_tipos_socio!personas_padrones_tipo_socio_id_fkey(nombre)
      )
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) throw error

  const miembros: MiembroPadron[] = ((data.personas_padrones ?? []) as unknown as {
    id: string
    persona_id: string
    numero_socio: string | null
    fecha_alta: string | null
    activo: boolean
    persona: { id: string; nombre: string; apellido: string; numero_documento: string | null } | null
    estado: { nombre: string } | null
    tipo_socio: { nombre: string } | null
  }[]).map((pp) => ({
    id: pp.id,
    persona_id: pp.persona_id,
    nombre: pp.persona?.nombre ?? '',
    apellido: pp.persona?.apellido ?? '',
    numero_documento: pp.persona?.numero_documento ?? null,
    estado_padron: pp.estado?.nombre ?? null,
    tipo_socio: pp.tipo_socio?.nombre ?? null,
    numero_socio: pp.numero_socio,
    fecha_alta: pp.fecha_alta,
    activo: pp.activo,
  }))

  return {
    id: data.id,
    nombre: data.nombre,
    slug: data.slug,
    tipo: data.tipo,
    es_externo: data.es_externo,
    activo: data.activo,
    fuente_externa: data.fuente_externa,
    created_at: data.created_at,
    miembros,
  }
}
