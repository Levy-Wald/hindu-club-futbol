import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export type NivelSalud = 'basico' | 'completo' | 'denegado'

export interface PermisosSalud {
  puede_ver_lesiones: boolean
  puede_ver_datos_medicos: boolean
  puede_ver_obra_social: boolean
  puede_ver_autorizaciones: boolean
  puede_ver_contactos: boolean
  puede_ver_vehiculos: boolean
  puede_ver_menores: boolean
  puede_exportar: boolean
  nivel: NivelSalud
  user_id: string | null
  persona_id: string | null
}

export async function obtenerPermisosSalud(): Promise<PermisosSalud> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      puede_ver_lesiones: false, puede_ver_datos_medicos: false,
      puede_ver_obra_social: false, puede_ver_autorizaciones: false,
      puede_ver_contactos: false, puede_ver_vehiculos: false,
      puede_ver_menores: false, puede_exportar: false,
      nivel: 'denegado', user_id: null, persona_id: null,
    }
  }

  const userId = user.id

  // Get persona_id for this user
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const personaId = persona?.id ?? null

  // Get atributos for this persona
  let atributos: string[] = []
  if (personaId) {
    const { data: attrs } = await supabase
      .from('personas_atributos')
      .select('atributo_slug')
      .eq('persona_id', personaId)
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)

    atributos = (attrs ?? []).map(a => a.atributo_slug)
  }

  const esAdmin = atributos.includes('admin_sistema') || atributos.includes('admin_tenant')
  const esStaffMedico = atributos.includes('staff_medico')
  const esResponsableMenores = atributos.includes('staff_responsable_menores')
  const esAccesoTotal = atributos.includes('staff_acceso_total_salud')

  if (esAdmin || esAccesoTotal) {
    return {
      puede_ver_lesiones: true, puede_ver_datos_medicos: true,
      puede_ver_obra_social: true, puede_ver_autorizaciones: true,
      puede_ver_contactos: true, puede_ver_vehiculos: true,
      puede_ver_menores: true, puede_exportar: true,
      nivel: 'completo', user_id: userId, persona_id: personaId,
    }
  }

  if (esStaffMedico) {
    return {
      puede_ver_lesiones: true, puede_ver_datos_medicos: true,
      puede_ver_obra_social: true, puede_ver_autorizaciones: false,
      puede_ver_contactos: true, puede_ver_vehiculos: false,
      puede_ver_menores: esResponsableMenores,
      puede_exportar: false,
      nivel: 'completo', user_id: userId, persona_id: personaId,
    }
  }

  // Staff regular
  return {
    puede_ver_lesiones: true, puede_ver_datos_medicos: false,
    puede_ver_obra_social: false, puede_ver_autorizaciones: true,
    puede_ver_contactos: true, puede_ver_vehiculos: true,
    puede_ver_menores: esResponsableMenores,
    puede_exportar: false,
    nivel: 'basico', user_id: userId, persona_id: personaId,
  }
}
