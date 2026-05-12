'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canUsarPantallaAcceso } from './permisos'
import { buscarPersonaPorDni } from './queries'
import { normalizarDni, esDniValido } from './normalizar-dni'
import type { ResultadoVerificacion, VeredictoAcceso, MotivoAcceso, EventoMinimal } from './types'

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Verificar acceso de una persona por DNI.
 * Registra la consulta en acceso_logs (audit trail).
 */
export async function verificarAccesoAction(input: {
  dni: string
  fecha?: string
}): Promise<ActionResult<{ resultado: ResultadoVerificacion | null }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: guardia } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!guardia) return { ok: false, error: 'Persona del guardia no encontrada' }

  const tenant_id = guardia.tenant_id ?? TENANT_ID

  const puede = await canUsarPantallaAcceso(guardia.id)
  if (!puede) return { ok: false, error: 'Sin permiso para acceso' }

  if (!esDniValido(input.dni)) {
    return { ok: false, error: 'DNI con formato inválido (debe tener 6-10 dígitos)' }
  }

  const dniNorm = normalizarDni(input.dni)
  const fecha = input.fecha ?? new Date().toISOString().slice(0, 10)

  const persona = await buscarPersonaPorDni(dniNorm, tenant_id)
  const serviceClient = createServiceRoleClient()

  if (!persona) {
    // ROJO — persona no encontrada
    await serviceClient
      .from('acceso_logs')
      .insert({
        tenant_id,
        persona_id: null,
        dni_consultado: dniNorm,
        guardia_persona_id: guardia.id,
        veredicto: 'rojo' as const,
        motivos: [{ tipo: 'no_encontrado', descripcion: 'DNI no registrado en el sistema' }],
      })

    return { ok: true, data: { resultado: null } }
  }

  // Persona encontrada → llamar RPC
  const { data: rpcResult, error: rpcErr } = await serviceClient.rpc(
    'verificar_acceso_persona',
    {
      p_persona_id: persona.persona_id,
      p_tenant_id: tenant_id,
      p_fecha: fecha,
    }
  )
  if (rpcErr) return { ok: false, error: rpcErr.message }

  const veredicto = rpcResult.veredicto as VeredictoAcceso

  // Registrar en acceso_logs
  const { data: log, error: logErr } = await serviceClient
    .from('acceso_logs')
    .insert({
      tenant_id,
      persona_id: persona.persona_id,
      dni_consultado: dniNorm,
      guardia_persona_id: guardia.id,
      veredicto,
      motivos: rpcResult.motivos,
    })
    .select('id')
    .single()

  if (logErr) return { ok: false, error: logErr.message }

  return {
    ok: true,
    data: {
      resultado: {
        ...persona,
        veredicto,
        es_socio: rpcResult.es_socio as boolean,
        invitaciones_hoy: rpcResult.invitaciones_hoy as EventoMinimal[],
        invitaciones_otro_dia: rpcResult.invitaciones_otro_dia as EventoMinimal[],
        motivos: rpcResult.motivos as MotivoAcceso[],
        acceso_log_id: log.id,
      },
    },
  }
}

/**
 * Marca presente a la persona en un evento desde la pantalla de acceso.
 * Reusa marcarAsistenciaAction del módulo asistencias.
 */
export async function marcarPresenteEnEventoAction(input: {
  persona_id: string
  evento_id: string
  acceso_log_id: string
}): Promise<ActionResult<{ asistencia_id: string }>> {
  const { marcarAsistenciaAction } = await import('@/modules/asistencias/lib/actions')

  const result = await marcarAsistenciaAction({
    evento_id: input.evento_id,
    persona_id: input.persona_id,
    estado: 'presente',
  })

  if (!result.ok) return result

  // Actualizar acceso_log con trazabilidad
  const serviceClient = createServiceRoleClient()
  await serviceClient
    .from('acceso_logs')
    .update({
      asistencia_marcada: true,
      asistencia_id: result.data.asistencia_id,
      evento_id: input.evento_id,
    })
    .eq('id', input.acceso_log_id)

  return { ok: true, data: { asistencia_id: result.data.asistencia_id } }
}
