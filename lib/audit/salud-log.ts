'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export type AccionSalud =
  | 'salud.vista_lesiones'
  | 'salud.vista_datos_medicos'
  | 'salud.vista_obra_social'
  | 'salud.vista_autorizaciones'
  | 'salud.vista_contactos'
  | 'salud.vista_vehiculos'
  | 'salud.vista_alertas'
  | 'salud.exportar'

interface LogSaludParams {
  accion: AccionSalud
  user_id: string
  persona_id: string | null
  metadata?: Record<string, unknown>
}

export async function logAccesoSalud(params: LogSaludParams) {
  const supabase = await createClient()

  await supabase.from('audit_log').insert({
    tenant_id: TENANT_ID,
    tabla: 'salud',
    registro_id: null,
    accion: params.accion,
    actor_user_id: params.user_id,
    actor_persona_id: params.persona_id,
    actor_tipo: 'usuario',
    cambios: null,
    metadata: params.metadata ?? {},
  })
}
