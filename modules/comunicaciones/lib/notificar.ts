import { createClient } from '@/lib/supabase/server'
import { enviarEmail, renderPlantilla } from './email'
import { TENANT_ID } from '@/lib/tenant'


export async function notificarPersona(
  personaId: string,
  plantillaSlug: string,
  variables: Record<string, string>,
  canales: ('inapp' | 'email')[] = ['inapp']
) {
  const supabase = await createClient()

  // Fetch persona email
  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido, email_principal')
    .eq('id', personaId)
    .single()

  if (!persona) return { success: false, error: 'Persona no encontrada' }

  const results: { canal: string; success: boolean; error?: string }[] = []

  for (const canal of canales) {
    // Find template for this canal
    const suffix = canal === 'email' ? '_email' : '_inapp'
    const slugConSuffix = plantillaSlug.endsWith(suffix) ? plantillaSlug : plantillaSlug + suffix

    // Try with suffix first, then without
    let plantilla = null
    const { data: p1 } = await supabase
      .from('com_plantillas')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', slugConSuffix)
      .eq('activa', true)
      .is('deleted_at', null)
      .maybeSingle()
    plantilla = p1

    if (!plantilla) {
      const { data: p2 } = await supabase
        .from('com_plantillas')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('slug', plantillaSlug)
        .eq('activa', true)
        .eq('tipo', canal)
        .is('deleted_at', null)
        .maybeSingle()
      plantilla = p2
    }

    if (!plantilla) {
      results.push({ canal, success: false, error: `Plantilla ${slugConSuffix} no encontrada` })
      continue
    }

    const cuerpoRenderizado = renderPlantilla(plantilla.cuerpo, variables)
    const asuntoRenderizado = plantilla.asunto
      ? renderPlantilla(plantilla.asunto, variables)
      : plantilla.nombre

    if (canal === 'inapp') {
      // Create com_mensajes
      const { error: msgError } = await supabase
        .from('com_mensajes')
        .insert({
          tenant_id: TENANT_ID,
          destinatario_persona_id: personaId,
          origen_modulo_slug: plantillaSlug.split('_')[0] || 'sistema',
          asunto: asuntoRenderizado,
          cuerpo: cuerpoRenderizado,
          tipo_severidad: 'info',
        })

      // Create com_envios record
      await supabase.from('com_envios').insert({
        tenant_id: TENANT_ID,
        persona_id: personaId,
        canal: 'inapp',
        plantilla_slug: plantilla.slug,
        asunto: asuntoRenderizado,
        cuerpo_renderizado: cuerpoRenderizado,
        estado: msgError ? 'fallado' : 'enviado',
        error_mensaje: msgError?.message || null,
        enviado_at: msgError ? null : new Date().toISOString(),
      })

      results.push({ canal: 'inapp', success: !msgError, error: msgError?.message })
    } else if (canal === 'email') {
      if (!persona.email_principal) {
        results.push({ canal: 'email', success: false, error: 'Persona sin email' })
        continue
      }

      const emailResult = await enviarEmail(
        persona.email_principal,
        asuntoRenderizado,
        cuerpoRenderizado
      )

      await supabase.from('com_envios').insert({
        tenant_id: TENANT_ID,
        persona_id: personaId,
        canal: 'email',
        destinatario: persona.email_principal,
        plantilla_slug: plantilla.slug,
        asunto: asuntoRenderizado,
        cuerpo_renderizado: cuerpoRenderizado,
        estado: emailResult.success ? 'enviado' : 'fallado',
        error_mensaje: emailResult.error || null,
        enviado_at: emailResult.success ? new Date().toISOString() : null,
        metadata: emailResult.message_id ? { message_id: emailResult.message_id } : {},
      })

      results.push({ canal: 'email', success: emailResult.success, error: emailResult.error })
    }
  }

  return { success: results.every((r) => r.success), results }
}
