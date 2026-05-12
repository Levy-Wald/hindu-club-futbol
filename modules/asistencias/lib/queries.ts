'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { autoPoblarInvitadosDesdeEquipo } from './auto-poblar'
import type { InvitadosPorCategoria, PersonaInvitada, CategoriaRolEquipo } from './types'

/**
 * Devuelve los invitados de un evento agrupados por categoría.
 * Si el evento tiene equipo_id y no hay invitados aún, auto-popla lazy.
 * Una persona con múltiples roles aparece en cada categoría, misma asistencia.
 */
export async function obtenerInvitadosDeEvento(
  evento_id: string,
  tenant_id: string
): Promise<InvitadosPorCategoria> {
  const supabase = createServiceRoleClient()

  // 1. Cargar evento
  const { data: evento, error: errEvento } = await supabase
    .from('eventos')
    .select('id, equipo_id')
    .eq('id', evento_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (errEvento || !evento) throw new Error('Evento no encontrado')

  // 2. Verificar si ya hay invitados; si no, auto-poblar (lazy)
  const { count } = await supabase
    .from('evento_invitados')
    .select('id', { count: 'exact', head: true })
    .eq('evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)

  if ((count ?? 0) === 0 && evento.equipo_id) {
    await autoPoblarInvitadosDesdeEquipo(evento_id, evento.equipo_id, tenant_id)
  }

  // 3. Query via RPC
  const { data: invitados, error } = await supabase.rpc(
    'obtener_invitados_evento_con_roles',
    { p_evento_id: evento_id, p_tenant_id: tenant_id }
  )

  if (error) throw new Error(`Error obteniendo invitados: ${error.message}`)

  return agruparPorCategoria((invitados ?? []) as unknown as PersonaInvitada[])
}

function agruparPorCategoria(invitados: PersonaInvitada[]): InvitadosPorCategoria {
  const result: InvitadosPorCategoria = {
    deportivo: [],
    cuerpo_tecnico: [],
    comision_delegados: [],
  }

  for (const persona of invitados) {
    const categoriasIncluidas = new Set<string>()
    if (!persona.roles || persona.roles.length === 0) {
      // Sin rol en el equipo — default a deportivo
      result.deportivo.push(persona)
      continue
    }
    for (const rol of persona.roles) {
      const cat = rol.categoria as CategoriaRolEquipo
      if (cat in result && !categoriasIncluidas.has(cat)) {
        result[cat].push(persona)
        categoriasIncluidas.add(cat)
      }
    }
  }

  return result
}

/**
 * Obtiene datos del evento para la cabecera de la pantalla de asistencia.
 */
export async function obtenerEventoParaAsistencia(
  evento_id: string,
  tenant_id: string
) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('eventos')
    .select(`
      id, titulo, fecha, hora_inicio, hora_fin, tipo_evento_slug,
      equipo_id, descripcion
    `)
    .eq('id', evento_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (error || !data) throw new Error('Evento no encontrado')

  // Get equipo nombre if exists
  let equipoNombre: string | null = null
  if (data.equipo_id) {
    const { data: equipo } = await supabase
      .from('equipos')
      .select('nombre')
      .eq('id', data.equipo_id)
      .single()
    equipoNombre = equipo?.nombre ?? null
  }

  return { ...data, equipo_nombre: equipoNombre }
}
