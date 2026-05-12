'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canAdministrarNominas } from './permisos'
import { generateNominaToken } from './token-generator'
import { calcularCaducidad } from './calcular-caducidad'
import { validarCamposSolicitados } from './catalogo-campos'
import { buscarMatchPersona, esPersonaSocioActivo } from './matching'
import type { SubmitPayload, NivelValidacion } from './types'

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function getGuardia() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // AP-001 ✓: personas tiene deleted_at
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return persona
}

/**
 * Admin genera un link de nómina para un evento.
 */
export async function generarNominaLinkAction(input: {
  evento_id: string
  equipo_destino_id?: string | null
  entidad_destino_id?: string | null
  nombre_contacto?: string
  email_contacto?: string
  telefono_contacto?: string
  campos_solicitados?: string[]
  nivel_validacion?: string
}): Promise<ActionResult<{ token: string; url: string; caduca_at: string; nomina_id: string }>> {
  const persona = await getGuardia()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const puede = await canAdministrarNominas(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso para administrar nóminas' }

  const serviceClient = createServiceRoleClient()

  // Validar evento existe y pertenece al tenant
  // AP-001 ✓: eventos NO tiene deleted_at
  const { data: evento } = await serviceClient
    .from('eventos')
    .select('id, fecha, hora_inicio, hora_fin, tipo_evento_slug')
    .eq('id', input.evento_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle()

  if (!evento) return { ok: false, error: 'Evento no encontrado' }

  // Validar nivel de validación
  const nivel = (input.nivel_validacion ?? 'L0') as NivelValidacion
  const { data: nivelData } = await serviceClient
    .from('catalogo_niveles_validacion')
    .select('slug, activo')
    .eq('slug', nivel)
    .maybeSingle()

  if (!nivelData) return { ok: false, error: 'Nivel de validación no encontrado' }
  if (!nivelData.activo) return { ok: false, error: `Nivel ${nivel} no disponible en MVP` }

  // Validar campos
  const campos = validarCamposSolicitados(input.campos_solicitados)

  // Calcular caducidad (S9)
  const caduca_at = calcularCaducidad({
    fecha: evento.fecha,
    hora_inicio: evento.hora_inicio,
    hora_fin: evento.hora_fin,
  })

  // Generar token (S2: crypto.randomBytes)
  const token = generateNominaToken()

  // Insert (AP-002: no partial unique index issue, token is fully unique)
  const { data: nomina, error: insertErr } = await serviceClient
    .from('nominas_externas')
    .insert({
      tenant_id,
      token,
      evento_id: input.evento_id,
      equipo_destino_id: input.equipo_destino_id ?? null,
      entidad_destino_id: input.entidad_destino_id ?? null,
      nombre_contacto: input.nombre_contacto ?? null,
      email_contacto: input.email_contacto ?? null,
      telefono_contacto: input.telefono_contacto ?? null,
      campos_solicitados: campos,
      nivel_validacion: nivel,
      caduca_at: caduca_at.toISOString(),
      created_by_persona_id: persona.id,
    })
    .select('id, token, caduca_at')
    .single()

  if (insertErr) return { ok: false, error: insertErr.message }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const url = `${baseUrl}/nomina/${token}`

  return {
    ok: true,
    data: { token, url, caduca_at: nomina.caduca_at, nomina_id: nomina.id },
  }
}

/**
 * Submit público desde el form sin auth.
 * Llamado desde API route, no directamente desde client.
 */
export async function submitNominaPublicaAction(input: SubmitPayload): Promise<ActionResult<{ items_creados: number }>> {
  const serviceClient = createServiceRoleClient()

  // Buscar nómina por token
  const { data: nomina } = await serviceClient
    .from('nominas_externas')
    .select('id, tenant_id, estado, caduca_at, submissions_count, max_submissions, campos_solicitados, nivel_validacion')
    .eq('token', input.token)
    .is('deleted_at', null) // AP-001 ✓
    .maybeSingle()

  if (!nomina) return { ok: false, error: 'Link no válido' }
  if (nomina.estado !== 'pendiente') return { ok: false, error: 'Link ya completado o cancelado' }
  if (new Date(nomina.caduca_at) < new Date()) return { ok: false, error: 'Link caducado' }
  if (nomina.submissions_count >= nomina.max_submissions) return { ok: false, error: 'Límite de envíos alcanzado' }

  // Si nivel L1, email cargador obligatorio
  if (nomina.nivel_validacion === 'L1' && !input.cargador_email) {
    return { ok: false, error: 'Email del cargador es obligatorio para este nivel de validación' }
  }

  if (input.personas.length === 0 && input.entidades.length === 0) {
    return { ok: false, error: 'Debe agregar al menos una persona o entidad' }
  }

  const items: Array<{
    nomina_externa_id: string
    tenant_id: string
    tipo: 'persona' | 'entidad'
    persona_input: Record<string, string> | null
    entidad_input: Record<string, string> | null
    match_confidence: number | null
    match_decision: string | null
    persona_id_match: string | null
    entidad_id_match: string | null
  }> = []

  // Procesar personas
  for (const p of input.personas) {
    if (!p.nombre?.trim() || !p.apellido?.trim()) continue

    const matchResult = await buscarMatchPersona(nomina.tenant_id, {
      nombre: p.nombre.trim(),
      apellido: p.apellido.trim(),
      numero_documento: p.dni?.trim() || undefined,
    })

    let decision = matchResult.decision as string
    // D1: si match con persona en padrón socios → duplicada_socio
    if (matchResult.persona_id && matchResult.decision === 'auto_match') {
      const esSocio = await esPersonaSocioActivo(matchResult.persona_id, nomina.tenant_id)
      if (esSocio) decision = 'duplicada_socio'
    }

    items.push({
      nomina_externa_id: nomina.id,
      tenant_id: nomina.tenant_id,
      tipo: 'persona',
      persona_input: p as unknown as Record<string, string>,
      entidad_input: null,
      match_confidence: matchResult.score,
      match_decision: decision,
      persona_id_match: matchResult.persona_id,
      entidad_id_match: null,
    })
  }

  // Procesar entidades
  for (const e of input.entidades) {
    if (!e.nombre?.trim()) continue

    items.push({
      nomina_externa_id: nomina.id,
      tenant_id: nomina.tenant_id,
      tipo: 'entidad',
      persona_input: null,
      entidad_input: e as unknown as Record<string, string>,
      match_confidence: null,
      match_decision: 'crear_nueva',
      persona_id_match: null,
      entidad_id_match: null,
    })
  }

  if (items.length === 0) return { ok: false, error: 'No se encontraron datos válidos' }

  // Insert items
  const { error: itemsErr } = await serviceClient
    .from('nomina_externa_items')
    .insert(items)

  if (itemsErr) return { ok: false, error: itemsErr.message }

  // Update submissions_count
  const newCount = nomina.submissions_count + 1
  const updates: Record<string, unknown> = { submissions_count: newCount }
  if (newCount >= nomina.max_submissions) {
    updates.estado = 'completada'
    updates.completada_at = new Date().toISOString()
  }
  await serviceClient
    .from('nominas_externas')
    .update(updates)
    .eq('id', nomina.id)

  return { ok: true, data: { items_creados: items.length } }
}

/**
 * Admin confirma/rechaza un item de nómina.
 */
export async function confirmarItemAction(input: {
  item_id: string
  decision: 'crear_nueva' | 'usar_match' | 'rechazar'
  notas_admin?: string
}): Promise<ActionResult<{ persona_id?: string; entidad_id?: string }>> {
  try {
  const persona = await getGuardia()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const puede = await canAdministrarNominas(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const serviceClient = createServiceRoleClient()

  // S10: check item exists and not already processed
  const { data: item } = await serviceClient
    .from('nomina_externa_items')
    .select('*')
    .eq('id', input.item_id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null) // AP-001 ✓
    .maybeSingle()

  if (!item) return { ok: false, error: 'Item no encontrado' }
  if (item.procesada) return { ok: false, error: 'Item ya procesado' }

  // Obtener nomina parent
  const { data: nominaData } = await serviceClient
    .from('nominas_externas')
    .select('evento_id, tenant_id')
    .eq('id', item.nomina_externa_id)
    .single()

  if (!nominaData) return { ok: false, error: 'Nómina no encontrada' }

  if (input.decision === 'rechazar') {
    await serviceClient
      .from('nomina_externa_items')
      .update({
        match_decision: 'rechazada',
        procesada: true,
        procesada_at: new Date().toISOString(),
        procesada_por_persona_id: persona.id,
        notas_admin: input.notas_admin ?? null,
      })
      .eq('id', input.item_id)

    return { ok: true, data: {} }
  }

  if (item.tipo === 'persona') {
    let persona_id: string

    if (input.decision === 'usar_match' && item.persona_id_match) {
      persona_id = item.persona_id_match
    } else {
      // Crear persona nueva
      const pInput = item.persona_input as Record<string, string>
      // AP-001 ✓: personas tiene deleted_at (pero no filtramos, estamos insertando)
      const { data: nuevaPersona, error: createErr } = await serviceClient
        .from('personas')
        .insert({
          tenant_id,
          nombre: pInput.nombre,
          apellido: pInput.apellido,
          numero_documento: pInput.dni || null,
          tipo_documento: 'dni',
        })
        .select('id')
        .single()

      if (createErr) return { ok: false, error: createErr.message }
      persona_id = nuevaPersona.id
    }

    // Crear membresía en padrón temporal
    // Buscar o crear padrón de visitantes temporales
    let padron_id: string
    // AP-001 ✓: padrones NO tiene deleted_at
    const { data: padronTemp } = await serviceClient
      .from('padrones')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('tipo', 'visitantes_temporales')
      .maybeSingle()

    if (padronTemp) {
      padron_id = padronTemp.id
    } else {
      const { data: newPadron, error: padronErr } = await serviceClient
        .from('padrones')
        .insert({
          tenant_id,
          slug: 'visitantes-temporales',
          nombre: 'Visitantes temporales',
          tipo: 'visitantes_temporales',
          activo: true,
        })
        .select('id')
        .single()

      if (padronErr || !newPadron) {
        // Retry: maybe it was just created by a concurrent request
        const { data: retry } = await serviceClient
          .from('padrones')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('slug', 'visitantes-temporales')
          .maybeSingle()
        if (!retry) return { ok: false, error: padronErr?.message ?? 'Error creando padrón temporal' }
        padron_id = retry.id
      } else {
        padron_id = newPadron.id
      }
    }

    // Obtener fecha evento para vigencia
    const { data: evento } = await serviceClient
      .from('eventos')
      .select('fecha')
      .eq('id', nominaData.evento_id)
      .single()

    const fechaVigenciaHasta = evento?.fecha ?? new Date().toISOString().slice(0, 10)

    // AP-002 ✓: check-then-insert (partial unique possible)
    // AP-001 ✓: personas_padrones NO tiene deleted_at
    const { data: existente } = await serviceClient
      .from('personas_padrones')
      .select('id')
      .eq('padron_id', padron_id)
      .eq('persona_id', persona_id)
      .eq('tenant_id', tenant_id)
      .eq('activo', true)
      .maybeSingle()

    let membresia_id: string | null = null
    if (!existente) {
      const { data: mem } = await serviceClient
        .from('personas_padrones')
        .insert({
          tenant_id,
          padron_id,
          persona_id,
          activo: true,
          fecha_alta: new Date().toISOString().slice(0, 10),
          fecha_vigencia_hasta: fechaVigenciaHasta,
        })
        .select('id')
        .single()
      membresia_id = mem?.id ?? null
    }

    // Update item
    const updateData: Record<string, unknown> = {
      procesada: true,
      procesada_at: new Date().toISOString(),
      procesada_por_persona_id: persona.id,
      notas_admin: input.notas_admin ?? null,
    }
    if (input.decision === 'crear_nueva') {
      updateData.persona_id_creada = persona_id
      updateData.match_decision = 'crear_nueva'
    } else {
      updateData.match_decision = 'auto_match'
    }

    await serviceClient
      .from('nomina_externa_items')
      .update(updateData)
      .eq('id', input.item_id)

    return { ok: true, data: { persona_id } }
  }

  // Entidad
  if (item.tipo === 'entidad') {
    const eInput = item.entidad_input as Record<string, string>
    // AP-001 ✓: entidades tiene deleted_at
    const { data: nuevaEntidad, error: createErr } = await serviceClient
      .from('entidades')
      .insert({
        tenant_id,
        nombre: eInput.nombre,
        slug: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo: 'visitante',
      })
      .select('id')
      .single()

    if (createErr) return { ok: false, error: createErr.message }

    await serviceClient
      .from('nomina_externa_items')
      .update({
        entidad_id_creada: nuevaEntidad.id,
        match_decision: 'crear_nueva',
        procesada: true,
        procesada_at: new Date().toISOString(),
        procesada_por_persona_id: persona.id,
        notas_admin: input.notas_admin ?? null,
      })
      .eq('id', input.item_id)

    return { ok: true, data: { entidad_id: nuevaEntidad.id } }
  }

  return { ok: false, error: 'Tipo de item no soportado' }
  } catch (err) {
    console.error('[confirmarItemAction] Error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Error interno' }
  }
}

/**
 * Obtener defaults de validación por tipo de evento.
 */
export async function obtenerDefaultsEvento(tipo_evento_slug: string): Promise<{
  nivel: string
  campos: string[]
}> {
  const serviceClient = createServiceRoleClient()
  const { data } = await serviceClient
    .from('tipos_evento_validacion_default')
    .select('nivel_validacion_default, campos_default')
    .eq('tipo_evento_slug', tipo_evento_slug)
    .maybeSingle()

  return {
    nivel: data?.nivel_validacion_default ?? 'L0',
    campos: (data?.campos_default as string[]) ?? ['nombre', 'apellido', 'dni', 'rol'],
  }
}
