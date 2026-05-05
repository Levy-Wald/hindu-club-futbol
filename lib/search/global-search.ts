'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'
const MAX_POR_CATEGORIA = 5

export type SearchResultCategory = 'personas' | 'equipos' | 'padrones' | 'externos' | 'paginas'

export interface SearchResult {
  id: string
  categoria: SearchResultCategory
  titulo: string
  subtitulo?: string
  url: string
}

export interface SearchResults {
  personas: SearchResult[]
  equipos: SearchResult[]
  padrones: SearchResult[]
  externos: SearchResult[]
  paginas: SearchResult[]
}

const PAGINAS_ESTATICAS: SearchResult[] = [
  { id: 'page-personas', categoria: 'paginas', titulo: 'Personas', subtitulo: 'Gestión de personas del club', url: '/admin/personas' },
  { id: 'page-equipos', categoria: 'paginas', titulo: 'Equipos', subtitulo: 'Gestión de equipos y planteles', url: '/admin/equipos' },
  { id: 'page-padrones', categoria: 'paginas', titulo: 'Padrones', subtitulo: 'Padrones y registros de socios', url: '/admin/padrones' },
  { id: 'page-tutores', categoria: 'paginas', titulo: 'Tutores / Padres', subtitulo: 'Tutores y padres de menores', url: '/admin/tutores' },
  { id: 'page-bajas', categoria: 'paginas', titulo: 'Bajas', subtitulo: 'Personas dadas de baja', url: '/admin/bajas' },
  { id: 'page-externos', categoria: 'paginas', titulo: 'Externos', subtitulo: 'Entidades y clubes externos', url: '/admin/externos' },
  { id: 'page-cajas', categoria: 'paginas', titulo: 'Cajas', subtitulo: 'Gestión de cajas y movimientos', url: '/admin/cajas' },
  { id: 'page-comunicaciones', categoria: 'paginas', titulo: 'Comunicaciones', subtitulo: 'Comunicaciones y mensajes', url: '/admin/comunicaciones' },
  { id: 'page-configuracion', categoria: 'paginas', titulo: 'Configuración', subtitulo: 'Configuración del sistema', url: '/admin/configuracion' },
]

export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim()

  const paginasFiltradas = q.length === 0
    ? PAGINAS_ESTATICAS
    : PAGINAS_ESTATICAS.filter((p) =>
        p.titulo.toLowerCase().includes(q.toLowerCase()) ||
        (p.subtitulo ?? '').toLowerCase().includes(q.toLowerCase())
      )

  if (q.length < 2) {
    return {
      personas: [],
      equipos: [],
      padrones: [],
      externos: [],
      paginas: paginasFiltradas.slice(0, MAX_POR_CATEGORIA),
    }
  }

  const supabase = await createClient()

  const [personasRes, equiposRes, padronesRes, externosRes] = await Promise.allSettled([
    supabase
      .from('personas')
      .select('id, nombre, apellido, numero_documento, email_principal')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,numero_documento.ilike.%${q}%`)
      .order('apellido', { ascending: true })
      .limit(MAX_POR_CATEGORIA),

    supabase
      .from('equipos')
      .select('id, nombre, disciplina_slug')
      .eq('tenant_id', TENANT_ID)
      .ilike('nombre', `%${q}%`)
      .order('nombre', { ascending: true })
      .limit(MAX_POR_CATEGORIA),

    supabase
      .from('padrones')
      .select('id, nombre, tipo')
      .eq('tenant_id', TENANT_ID)
      .ilike('nombre', `%${q}%`)
      .order('nombre', { ascending: true })
      .limit(MAX_POR_CATEGORIA),

    supabase
      .from('entidades')
      .select('id, nombre, tipo')
      .eq('tenant_id', TENANT_ID)
      .ilike('nombre', `%${q}%`)
      .order('nombre', { ascending: true })
      .limit(MAX_POR_CATEGORIA),
  ])

  const personas: SearchResult[] =
    personasRes.status === 'fulfilled' && personasRes.value.data
      ? personasRes.value.data.map((p) => ({
          id: p.id,
          categoria: 'personas' as const,
          titulo: `${p.apellido}, ${p.nombre}`,
          subtitulo: p.numero_documento ? `DNI ${p.numero_documento}` : (p.email_principal ?? undefined),
          url: `/admin/personas/${p.id}`,
        }))
      : []

  const equipos: SearchResult[] =
    equiposRes.status === 'fulfilled' && equiposRes.value.data
      ? equiposRes.value.data.map((e) => ({
          id: e.id,
          categoria: 'equipos' as const,
          titulo: e.nombre,
          subtitulo: e.disciplina_slug ?? undefined,
          url: `/admin/equipos/${e.id}`,
        }))
      : []

  const padrones: SearchResult[] =
    padronesRes.status === 'fulfilled' && padronesRes.value.data
      ? padronesRes.value.data.map((p) => ({
          id: p.id,
          categoria: 'padrones' as const,
          titulo: p.nombre,
          subtitulo: p.tipo ?? undefined,
          url: `/admin/padrones/${p.id}`,
        }))
      : []

  const externos: SearchResult[] =
    externosRes.status === 'fulfilled' && externosRes.value.data
      ? externosRes.value.data.map((e) => ({
          id: e.id,
          categoria: 'externos' as const,
          titulo: e.nombre,
          subtitulo: e.tipo ?? undefined,
          url: '/admin/externos',
        }))
      : []

  return {
    personas,
    equipos,
    padrones,
    externos,
    paginas: paginasFiltradas.slice(0, MAX_POR_CATEGORIA),
  }
}
