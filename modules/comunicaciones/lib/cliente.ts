'use server'

import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { resolveAdapter } from './adapters/factory'
import { renderTemplate } from './renderer'

interface EnviarOpts {
  personaId: string
  plantillaSlug: string
  variables: Record<string, string>
  canal: 'email' | 'inapp'
  origenModuloSlug?: string
  origenEntidadId?: string
}

interface EnviarResult {
  ok: boolean
  envioId?: string
  error?: string
}

/**
 * Public API for sending communications.
 * Other modules call this function — it's the only public entry point.
 */
export async function enviarComunicacion(opts: EnviarOpts): Promise<EnviarResult> {
  const supabase = await createClient()
  const adapter = resolveAdapter()

  // 1. Fetch plantilla
  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('slug, nombre, tipo, asunto, cuerpo, variables_disponibles')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', opts.plantillaSlug)
    .eq('activa', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!plantilla) {
    return { ok: false, error: `Plantilla "${opts.plantillaSlug}" no encontrada o inactiva` }
  }

  // 2. Resolve destinatario
  let destinatario = opts.personaId
  if (opts.canal === 'email') {
    const { data: persona } = await supabase
      .from('personas')
      .select('email_principal')
      .eq('id', opts.personaId)
      .single()

    if (!persona?.email_principal) {
      return { ok: false, error: 'Persona sin email' }
    }
    destinatario = persona.email_principal
  }

  // 3. Render template
  const cuerpoRenderizado = renderTemplate(plantilla.cuerpo, opts.variables)
  const asuntoRenderizado = plantilla.asunto
    ? renderTemplate(plantilla.asunto, opts.variables)
    : plantilla.nombre

  // 4. Send via adapter
  const result = await adapter.enviar({
    canal: opts.canal,
    destinatario,
    asunto: asuntoRenderizado,
    cuerpo: cuerpoRenderizado,
  })

  // 5. Record in com_envios
  const { data: envio } = await supabase
    .from('com_envios')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: opts.personaId,
      canal: opts.canal,
      destinatario: opts.canal === 'email' ? destinatario : null,
      plantilla_slug: opts.plantillaSlug,
      asunto: asuntoRenderizado,
      cuerpo_renderizado: cuerpoRenderizado,
      estado: result.success ? 'enviado' : 'fallado',
      error_mensaje: result.error || null,
      enviado_at: result.success ? new Date().toISOString() : null,
      origen_modulo_slug: opts.origenModuloSlug || 'comunicaciones',
      origen_entidad_id: opts.origenEntidadId || null,
      metadata: {
        adapter: adapter.name,
        provider_id: result.provider_id || null,
        mock: adapter.name === 'mock',
      },
    })
    .select('id')
    .single()

  // 6. If inapp, also create com_mensajes
  if (opts.canal === 'inapp' && result.success) {
    await supabase.from('com_mensajes').insert({
      tenant_id: TENANT_ID,
      destinatario_persona_id: opts.personaId,
      origen_modulo_slug: opts.origenModuloSlug || 'comunicaciones',
      origen_entidad_id: opts.origenEntidadId || null,
      asunto: asuntoRenderizado,
      cuerpo: cuerpoRenderizado,
      tipo_severidad: 'info',
    })
  }

  return {
    ok: result.success,
    envioId: envio?.id,
    error: result.error,
  }
}
