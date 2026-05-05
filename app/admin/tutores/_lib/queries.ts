import { createClient } from '@/lib/supabase/server'

export interface TutoresQueryParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  conMenor?: boolean
  sinMenor?: boolean
}

export interface TutorMenor {
  id: string
  nombre: string
  apellido: string
  tipo_vinculo_slug: string
}

export interface TutorRow {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  telefono_principal: string | null
  estado: string
  menores: TutorMenor[]
}

export async function fetchTutores(params: TutoresQueryParams): Promise<{ data: TutorRow[]; total: number }> {
  const {
    search = '',
    page = 1,
    pageSize = 50,
    sortBy = 'apellido',
    sortDir = 'asc',
    conMenor = false,
    sinMenor = false,
  } = params

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Primero obtenemos los IDs de personas con atributo padre_tutor activo
  let query = supabase
    .from('personas')
    .select(
      `id, nombre, apellido, numero_documento, email_principal, telefono_principal, estado,
       personas_atributos!personas_atributos_persona_id_fkey(atributo_slug, activo),
       personas_vinculos_origen:personas_vinculos!personas_vinculos_persona_origen_id_fkey(
         id, tipo_vinculo_slug, activo,
         destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido,
           personas_atributos!personas_atributos_persona_id_fkey(atributo_slug, activo)
         )
       )`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .eq('personas_atributos.atributo_slug', 'padre_tutor')
    .eq('personas_atributos.activo', true)

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%`
    )
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  // Filtrar solo personas que realmente tienen el atributo padre_tutor activo
  // (el filtro de supabase en relación nested no filtra la fila padre)
  let tutores = (data ?? []).filter((p) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p.personas_atributos as any[])?.some(
      (a: { atributo_slug: string; activo: boolean }) =>
        a.atributo_slug === 'padre_tutor' && a.activo
    )
  )

  // Mapear a TutorRow con menores
  const result: TutorRow[] = tutores.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vinculos = (p.personas_vinculos_origen as any[]) ?? []
    const menores: TutorMenor[] = vinculos
      .filter(
        (v) =>
          v.activo &&
          ['padre', 'madre', 'tutor'].includes(v.tipo_vinculo_slug) &&
          v.destino &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v.destino.personas_atributos as any[])?.some(
            (a: { atributo_slug: string; activo: boolean }) =>
              a.atributo_slug === 'menor_de_edad' && a.activo
          )
      )
      .map((v) => ({
        id: v.destino.id,
        nombre: v.destino.nombre,
        apellido: v.destino.apellido,
        tipo_vinculo_slug: v.tipo_vinculo_slug,
      }))

    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero_documento: p.numero_documento,
      email_principal: p.email_principal,
      telefono_principal: p.telefono_principal,
      estado: p.estado,
      menores,
    }
  })

  // Aplicar filtros de menores vinculados
  let filtered = result
  if (conMenor && !sinMenor) {
    filtered = filtered.filter((t) => t.menores.length > 0)
  } else if (sinMenor && !conMenor) {
    filtered = filtered.filter((t) => t.menores.length === 0)
  }

  return { data: filtered, total: count ?? 0 }
}

export async function fetchTutorVinculos(personaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas_vinculos')
    .select(
      `id, tipo_vinculo_slug, activo, fecha_inicio, notas,
       destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido, fecha_nacimiento)`
    )
    .eq('persona_origen_id', personaId)
    .in('tipo_vinculo_slug', ['padre', 'madre', 'tutor'])
    .eq('activo', true)

  if (error) throw error
  return data ?? []
}
