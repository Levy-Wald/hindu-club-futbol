'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { normalizarDni } from './normalizar-dni'

export type PersonaEncontrada = {
  persona_id: string
  nombre: string
  apellido: string
  foto_url: string | null
  dni: string
} | null

/**
 * Busca persona por numero_documento (DNI normalizado).
 * personas.deleted_at SÍ existe — se filtra.
 */
export async function buscarPersonaPorDni(
  dni: string,
  tenant_id: string
): Promise<PersonaEncontrada> {
  const supabase = createServiceRoleClient()
  const dniNorm = normalizarDni(dni)

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, foto_perfil_url, numero_documento')
    .eq('tenant_id', tenant_id)
    .eq('numero_documento', dniNorm)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  return {
    persona_id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    foto_url: data.foto_perfil_url,
    dni: data.numero_documento,
  }
}
