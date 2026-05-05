'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchMiEquipo() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return null

  const { data: asignacion } = await supabase
    .from('personas_equipos')
    .select(`
      id, rol_equipo_slug, dorsal, posicion,
      equipo:equipos!equipo_id(
        id, nombre, disciplina_slug, modalidad,
        color_principal, color_secundario,
        foto_url, escudo_url, foto_equipo_url,
        indumentaria, torneo, activo,
        categoria:categorias_equipo!categoria_id(nombre_display),
        entidad:entidades!entidad_id(id, nombre)
      )
    `)
    .eq('persona_id', persona.id)
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (!asignacion) return null

  return { persona, asignacion }
}

export async function fetchPlantelEquipo(equipoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('personas_equipos')
    .select(`
      id, rol_equipo_slug, dorsal, posicion,
      persona:personas!persona_id(
        id, nombre, apellido, foto_perfil_url,
        telefono_principal, whatsapp, email_principal,
        fecha_nacimiento, numero_documento
      )
    `)
    .eq('equipo_id', equipoId)
    .eq('activo', true)
    .order('rol_equipo_slug', { ascending: true })

  return data ?? []
}

export async function fetchHorariosEquipo(equipoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('equipos_horarios')
    .select(`
      id, dia_semana, hora_inicio, hora_fin, tipo_actividad, activo,
      sede:sedes!sede_id(id, nombre),
      cancha:canchas!cancha_id(id, nombre)
    `)
    .eq('equipo_id', equipoId)
    .eq('activo', true)
    .order('dia_semana', { ascending: true })

  return data ?? []
}

export async function fetchEquiposDisponibles() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('equipos')
    .select('id, nombre, disciplina_slug')
    .order('nombre', { ascending: true })

  return data ?? []
}
