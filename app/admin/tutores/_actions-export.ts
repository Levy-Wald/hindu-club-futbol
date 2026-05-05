'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export interface ExportarTutoresParams {
  campos: string[]
  filtros: {
    search?: string
    conMenor?: boolean
    sinMenor?: boolean
  }
}

export async function exportarTutores(
  params: ExportarTutoresParams
): Promise<{ ok: boolean; data: Record<string, string>[] }> {
  const { filtros } = params
  const { search = '', conMenor = false, sinMenor = false } = filtros

  const supabase = await createClient()

  let query = supabase
    .from('personas')
    .select(
      `id, nombre, apellido, numero_documento, email_principal, telefono_principal, estado,
       personas_atributos!personas_atributos_persona_id_fkey(atributo_slug, activo),
       personas_vinculos_origen:personas_vinculos!personas_vinculos_persona_origen_id_fkey(
         tipo_vinculo_slug, activo,
         destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido,
           personas_atributos!personas_atributos_persona_id_fkey(atributo_slug, activo)
         )
       )`
    )
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .eq('personas_atributos.atributo_slug', 'padre_tutor')
    .eq('personas_atributos.activo', true)

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%`
    )
  }

  query = query.order('apellido', { ascending: true }).limit(5000)

  const { data, error } = await query

  if (error) {
    return { ok: false, data: [] }
  }

  // Filtrar solo los que realmente tienen padre_tutor activo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tutores = (data ?? []).filter((p: any) =>
    p.personas_atributos?.some(
      (a: { atributo_slug: string; activo: boolean }) =>
        a.atributo_slug === 'padre_tutor' && a.activo
    )
  )

  // Mapear con menores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = tutores.map((p: any) => {
    const vinculos = p.personas_vinculos_origen ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const menores = vinculos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((v: any) =>
        v.activo &&
        ['padre', 'madre', 'tutor'].includes(v.tipo_vinculo_slug) &&
        v.destino &&
        v.destino.personas_atributos?.some(
          (a: { atributo_slug: string; activo: boolean }) =>
            a.atributo_slug === 'menor_de_edad' && a.activo
        )
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((v: any) => `${v.destino.apellido}, ${v.destino.nombre}`)

    return {
      nombre: p.nombre ?? '',
      apellido: p.apellido ?? '',
      numero_documento: p.numero_documento ?? '',
      email_principal: p.email_principal ?? '',
      telefono_principal: p.telefono_principal ?? '',
      menores: menores.join('; '),
      estado: p.estado ?? '',
    }
  })

  // Aplicar filtros
  let filtered = result
  if (conMenor && !sinMenor) {
    filtered = filtered.filter((t: Record<string, string>) => t.menores.length > 0)
  } else if (sinMenor && !conMenor) {
    filtered = filtered.filter((t: Record<string, string>) => t.menores.length === 0)
  }

  return { ok: true, data: filtered }
}
