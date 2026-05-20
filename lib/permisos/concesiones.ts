import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'


export interface PermisosConcesiones {
  es_admin_concesiones: boolean
  es_concesionario: boolean
  concesionario_id?: string
  puede_ver_credenciales_mp: boolean
  puede_registrar_venta: boolean
  puede_anular_venta: boolean
  puede_calcular_canon: boolean
  puede_cobrar_canon: boolean
  user_id: string | null
  persona_id: string | null
}

export async function obtenerPermisosConcesiones(): Promise<PermisosConcesiones> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const denegado: PermisosConcesiones = {
    es_admin_concesiones: false,
    es_concesionario: false,
    puede_ver_credenciales_mp: false,
    puede_registrar_venta: false,
    puede_anular_venta: false,
    puede_calcular_canon: false,
    puede_cobrar_canon: false,
    user_id: null,
    persona_id: null,
  }

  if (!user) return denegado

  const userId = user.id

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
  const esAdminConcesiones = esAdmin || atributos.includes('admin_concesiones')

  // Detectar si la persona es concesionario
  const serviceClient = createServiceRoleClient()
  const { data: comoConcesionario } = await serviceClient
    .from('concesionarios')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('activo', true)
    .maybeSingle()

  return {
    es_admin_concesiones: esAdminConcesiones,
    es_concesionario: !!comoConcesionario,
    concesionario_id: comoConcesionario?.id,
    puede_ver_credenciales_mp: esAdminConcesiones,
    puede_registrar_venta: esAdminConcesiones || !!comoConcesionario,
    puede_anular_venta: esAdminConcesiones,
    puede_calcular_canon: esAdminConcesiones,
    puede_cobrar_canon: esAdminConcesiones,
    user_id: userId,
    persona_id: personaId,
  }
}
