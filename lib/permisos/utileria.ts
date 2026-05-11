import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export interface PermisosUtileria {
  es_staff_utileria: boolean
  equipos_donde_es_responsable: string[]
  puede_ver_inventario_completo: boolean
  puede_crear_items: boolean
  puede_preparar_solicitudes: boolean
  puede_validar_devoluciones: boolean
  puede_asignar_cargos: boolean
  puede_solicitar_para_equipos: string[]
  user_id: string | null
  persona_id: string | null
}

const ROLES_RESPONSABLE = ['dt', 'capitan', 'subcapitan', 'delegado']

export async function obtenerPermisosUtileria(): Promise<PermisosUtileria> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const denegado: PermisosUtileria = {
    es_staff_utileria: false,
    equipos_donde_es_responsable: [],
    puede_ver_inventario_completo: false,
    puede_crear_items: false,
    puede_preparar_solicitudes: false,
    puede_validar_devoluciones: false,
    puede_asignar_cargos: false,
    puede_solicitar_para_equipos: [],
    user_id: null,
    persona_id: null,
  }

  if (!session) return denegado

  const userId = session.user.id

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const personaId = persona?.id ?? null
  if (!personaId) return { ...denegado, user_id: userId }

  // Get atributos
  const { data: attrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const atributos = (attrs ?? []).map(a => a.atributo_slug)

  const esAdmin = atributos.includes('admin_sistema') || atributos.includes('admin_tenant')
  const esStaff = esAdmin || atributos.includes('staff_utileria') || atributos.includes('comision_utileria')

  // Get equipos where persona is DT/Capitán/SubCapitán/Delegado
  const { data: equiposData } = await supabase
    .from('personas_equipos')
    .select('equipo_id')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ROLES_RESPONSABLE)

  const equiposResponsable = (equiposData ?? []).map(e => e.equipo_id)

  return {
    es_staff_utileria: esStaff,
    equipos_donde_es_responsable: equiposResponsable,
    puede_ver_inventario_completo: esStaff,
    puede_crear_items: esStaff,
    puede_preparar_solicitudes: esStaff,
    puede_validar_devoluciones: esStaff,
    puede_asignar_cargos: esStaff,
    puede_solicitar_para_equipos: esStaff
      ? [] // staff can do all equipos, resolved at query time
      : equiposResponsable,
    user_id: userId,
    persona_id: personaId,
  }
}
