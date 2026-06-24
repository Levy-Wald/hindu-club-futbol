'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { TENANT_ID } from '@/lib/tenant'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

// F2 — Mensajería interna del portal. Entrega dirigida persona→persona usando el
// inbox de notificaciones (tipo 'mensaje_directo'): el mensaje aparece en las
// notificaciones del destinatario (admin o portal). Complementa el contacto por
// WhatsApp; no reemplaza un chat en tiempo real (eso sería un módulo F5).
export async function enviarMensajeInterno(input: {
  destinatario_persona_id: string
  asunto?: string
  cuerpo: string
}) {
  const remitenteId = await getCurrentPersonaId()
  if (!remitenteId) return formatResult(false, 'No autenticado')

  const cuerpo = input.cuerpo?.trim()
  if (!cuerpo) return formatResult(false, 'Escribí un mensaje.')
  if (!input.destinatario_persona_id) return formatResult(false, 'Falta el destinatario.')
  if (input.destinatario_persona_id === remitenteId) return formatResult(false, 'No podés enviarte un mensaje a vos mismo.')

  const supabase = createServiceRoleClient()

  // Validar que el destinatario exista en el tenant
  const [{ data: dest }, { data: yo }] = await Promise.all([
    supabase.from('personas').select('id').eq('id', input.destinatario_persona_id).eq('tenant_id', TENANT_ID).maybeSingle(),
    supabase.from('personas').select('nombre, apellido').eq('id', remitenteId).maybeSingle(),
  ])
  if (!dest) return formatResult(false, 'Destinatario no encontrado.')

  const remitente = yo ? `${yo.nombre} ${yo.apellido}` : 'Un socio'
  const asunto = input.asunto?.trim()

  const res = await crearNotificacion({
    tenant_id: TENANT_ID,
    destinatario_persona_id: input.destinatario_persona_id,
    tipo: 'mensaje_directo',
    titulo: asunto ? `${remitente}: ${asunto}` : `Mensaje de ${remitente}`,
    mensaje: cuerpo,
    prioridad: 'media',
    generada_por_persona_id: remitenteId,
    metadata: { remitente_nombre: remitente, asunto: asunto ?? null },
  })

  if (!res.ok) return formatResult(false, res.error ?? 'No se pudo enviar el mensaje.')
  return formatResult(true, 'Mensaje enviado.')
}
