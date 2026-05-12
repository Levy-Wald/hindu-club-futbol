'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { autoPoblarInvitadosDesdeEquipo } from './auto-poblar'
import type {
  InvitadosPorCategoria,
  InvitadosCompleto,
  PersonaInvitada,
  EntidadInvitada,
  EquipoInvitado,
  CategoriaRolEquipo,
} from './types'

/**
 * Devuelve los invitados de un evento agrupados por categoría.
 * Si el evento tiene equipo_id y no hay invitados aún, auto-popla lazy.
 * Una persona con múltiples roles aparece en cada categoría, misma asistencia.
 */
export async function obtenerInvitadosDeEvento(
  evento_id: string,
  tenant_id: string
): Promise<InvitadosPorCategoria> {
  const completo = await obtenerInvitadosCompletoDeEvento(evento_id, tenant_id)
  return {
    deportivo: completo.deportivo,
    cuerpo_tecnico: completo.cuerpo_tecnico,
    comision_delegados: completo.comision_delegados,
  }
}

/**
 * Devuelve TODOS los invitados: personas (por categoría) + entidades + equipos.
 */
export async function obtenerInvitadosCompletoDeEvento(
  evento_id: string,
  tenant_id: string
): Promise<InvitadosCompleto> {
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

  // 3. Query personas via RPC
  const { data: invitados, error } = await supabase.rpc(
    'obtener_invitados_evento_con_roles',
    { p_evento_id: evento_id, p_tenant_id: tenant_id }
  )

  if (error) throw new Error(`Error obteniendo invitados: ${error.message}`)

  const categorias = agruparPorCategoria((invitados ?? []) as unknown as PersonaInvitada[])

  // 4. Query entidades via RPC
  const { data: rawEntidades } = await supabase.rpc(
    'obtener_entidades_invitadas_evento',
    { p_evento_id: evento_id, p_tenant_id: tenant_id }
  )

  const entidades: EntidadInvitada[] = ((rawEntidades ?? []) as unknown as Array<{
    entidad_id: string; nombre: string; tipo: string;
    evento_invitado_id: string; marca_asistencia: boolean;
    asistencia_id: string | null; asistencia_estado: string;
    asistencia_nota: string | null; asistencia_respondido_at: string | null;
  }>).map(e => ({
    entidad_id: e.entidad_id,
    nombre: e.nombre,
    tipo: e.tipo,
    evento_invitado_id: e.evento_invitado_id,
    marca_asistencia: e.marca_asistencia,
    asistencia: {
      id: e.asistencia_id,
      estado: (e.asistencia_estado as EntidadInvitada['asistencia']['estado']) ?? 'pendiente',
      nota: e.asistencia_nota,
      respondido_at: e.asistencia_respondido_at,
    },
  }))

  // 5. Query equipos via RPC
  const { data: rawEquipos } = await supabase.rpc(
    'obtener_equipos_invitados_evento',
    { p_evento_id: evento_id, p_tenant_id: tenant_id }
  )

  const equipos: EquipoInvitado[] = ((rawEquipos ?? []) as unknown as Array<{
    equipo_id: string; nombre: string;
    evento_invitado_id: string; marca_asistencia: boolean;
    asistencia_id: string | null; asistencia_estado: string;
    asistencia_nota: string | null; asistencia_respondido_at: string | null;
  }>).map(e => ({
    equipo_id: e.equipo_id,
    nombre: e.nombre,
    evento_invitado_id: e.evento_invitado_id,
    marca_asistencia: e.marca_asistencia,
    asistencia: {
      id: e.asistencia_id,
      estado: (e.asistencia_estado as EquipoInvitado['asistencia']['estado']) ?? 'pendiente',
      nota: e.asistencia_nota,
      respondido_at: e.asistencia_respondido_at,
    },
  }))

  return { ...categorias, entidades, equipos }
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
