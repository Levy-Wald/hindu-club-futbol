'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchMiPersonaCompleta() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Misma query que fetchPersonaById pero buscando por user_id
  const { data: persona } = await supabase
    .from('personas')
    .select(`
      *,
      personas_atributos!personas_atributos_persona_id_fkey(id, atributo_slug, valor, activo, fecha_inicio, fecha_fin, created_at),
      personas_vinculos_origen:personas_vinculos!personas_vinculos_persona_origen_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido, numero_documento)
      ),
      personas_vinculos_destino:personas_vinculos!personas_vinculos_persona_destino_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        origen:personas!personas_vinculos_persona_origen_id_fkey(id, nombre, apellido, numero_documento)
      ),
      personas_padrones!personas_padrones_persona_id_fkey(id, padron_id, estado_padron_id, tipo_socio_id, numero_socio, fecha_alta, activo,
        padron:padrones(id, nombre, slug)
      ),
      personas_equipos!personas_equipos_persona_id_fkey(id, equipo_id, rol_equipo_slug, dorsal, posicion, fecha_inicio, activo,
        equipo:equipos!equipo_id(id, nombre, disciplina_slug, modalidad,
          categorias_equipo!categoria_id(id, nombre_display)
        )
      )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return persona
}
