import { createClient } from '@/lib/supabase/server'

// Un "tutor" es quien es origen de un vínculo legal hacia un menor:
// padre / madre / tutor_legal. El destino del vínculo es el menor a cargo.
const TIPOS_TUTOR = ['padre', 'madre', 'tutor_legal']

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

export async function fetchTutores(
  tenantId: string,
  params: { search?: string } = {},
): Promise<TutorRow[]> {
  const { search = '' } = params
  const supabase = await createClient()

  const { data } = await supabase
    .from('personas_vinculos')
    .select(`
      tipo_vinculo_slug,
      tutor:personas!personas_vinculos_persona_origen_id_fkey(
        id, nombre, apellido, numero_documento, email_principal, telefono_principal, estado, deleted_at
      ),
      menor:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido)
    `)
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .in('tipo_vinculo_slug', TIPOS_TUTOR)

  const map = new Map<string, TutorRow>()
  const s = search.trim().toLowerCase()

  for (const row of data ?? []) {
    const t = row.tutor as unknown as {
      id: string; nombre: string; apellido: string
      numero_documento: string | null; email_principal: string | null
      telefono_principal: string | null; estado: string; deleted_at: string | null
    } | null
    if (!t || t.deleted_at) continue

    if (s && !`${t.nombre} ${t.apellido} ${t.numero_documento ?? ''}`.toLowerCase().includes(s)) continue

    let tr = map.get(t.id)
    if (!tr) {
      tr = {
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        numero_documento: t.numero_documento,
        email_principal: t.email_principal,
        telefono_principal: t.telefono_principal,
        estado: t.estado,
        menores: [],
      }
      map.set(t.id, tr)
    }

    const m = row.menor as unknown as { id: string; nombre: string; apellido: string } | null
    if (m) tr.menores.push({ id: m.id, nombre: m.nombre, apellido: m.apellido, tipo_vinculo_slug: row.tipo_vinculo_slug })
  }

  return [...map.values()].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
  )
}
