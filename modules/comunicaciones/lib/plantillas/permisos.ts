import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export interface PermisosComunicaciones {
  puede_crear: boolean
  puede_editar: boolean
  puede_eliminar: boolean
  puede_duplicar: boolean
  puede_enviar_masivo: boolean
  persona_id: string | null
}

export async function obtenerPermisosComunicaciones(): Promise<PermisosComunicaciones> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const denegado: PermisosComunicaciones = {
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
    puede_duplicar: false,
    puede_enviar_masivo: false,
    persona_id: null,
  }

  if (!user) return denegado

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (!persona) return denegado

  const { data: attrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona.id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const atributos = (attrs ?? []).map(a => a.atributo_slug)
  const esAdmin = atributos.includes('sistema.admin') || atributos.includes('tenant.admin')
  const esAdminCom = esAdmin || atributos.includes('comunicaciones.admin')
  const esEditor = esAdminCom || atributos.includes('comunicaciones.editor')

  return {
    puede_crear: esAdminCom,
    puede_editar: esEditor,
    puede_eliminar: esAdminCom,
    puede_duplicar: esAdminCom,
    puede_enviar_masivo: esAdminCom,
    persona_id: persona.id,
  }
}
