'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

async function getPersonaId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()
  return persona?.id ?? null
}

export async function listarMisNotificaciones(filtros?: {
  estado?: 'no_leidas' | 'todas' | 'archivadas'
  tipo?: string
  prioridad?: string
  page?: number
  pageSize?: number
}) {
  const personaId = await getPersonaId()
  if (!personaId) return { rows: [], total: 0, page: 1, pageSize: 20 }

  const supabase = await createClient()
  let query = supabase
    .from('notificaciones')
    .select(
      `id, tipo_slug, titulo, mensaje, link_accion, prioridad,
       leida_at, archivada_at, created_at,
       origen_tabla, origen_registro_id,
       catalogo_tipos_notificacion!tipo_slug (nombre, icono, color, categoria)`,
      { count: 'exact' }
    )
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .order('created_at', { ascending: false })

  if (filtros?.estado === 'no_leidas') {
    query = query.is('leida_at', null).is('archivada_at', null)
  } else if (filtros?.estado === 'archivadas') {
    query = query.not('archivada_at', 'is', null)
  } else {
    query = query.is('archivada_at', null)
  }

  if (filtros?.tipo) query = query.eq('tipo_slug', filtros.tipo)
  if (filtros?.prioridad) query = query.eq('prioridad', filtros.prioridad)

  const page = filtros?.page ?? 1
  const pageSize = filtros?.pageSize ?? 50
  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return { rows: data ?? [], total: count ?? 0, page, pageSize }
}

export async function obtenerConteoNoLeidas() {
  const personaId = await getPersonaId()
  if (!personaId) return { cant_total: 0, cant_critica: 0, cant_alta: 0 }

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_notificaciones_no_leidas_por_persona')
    .select('cant_total, cant_critica, cant_alta')
    .eq('destinatario_persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  return data ?? { cant_total: 0, cant_critica: 0, cant_alta: 0 }
}

export async function marcarComoLeida(notificacionId: string) {
  const personaId = await getPersonaId()
  if (!personaId) return { ok: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida_at: new Date().toISOString() })
    .eq('id', notificacionId)
    .eq('destinatario_persona_id', personaId)
    .is('leida_at', null)

  if (error) return { ok: false }
  revalidatePath('/admin/notificaciones')
  return { ok: true }
}

export async function marcarTodasComoLeidas() {
  const personaId = await getPersonaId()
  if (!personaId) return { ok: false, cant: 0 }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('notificaciones')
    .update({ leida_at: new Date().toISOString() }, { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .is('leida_at', null)

  if (error) return { ok: false, cant: 0 }
  revalidatePath('/admin/notificaciones')
  return { ok: true, cant: count ?? 0 }
}

export async function archivarNotificacion(notificacionId: string) {
  const personaId = await getPersonaId()
  if (!personaId) return { ok: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notificaciones')
    .update({
      archivada_at: new Date().toISOString(),
      leida_at: new Date().toISOString(),
    })
    .eq('id', notificacionId)
    .eq('destinatario_persona_id', personaId)

  if (error) return { ok: false }
  revalidatePath('/admin/notificaciones')
  return { ok: true }
}

export async function archivarTodasLeidas() {
  const personaId = await getPersonaId()
  if (!personaId) return { ok: false, cant: 0 }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('notificaciones')
    .update({ archivada_at: new Date().toISOString() }, { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .not('leida_at', 'is', null)
    .is('archivada_at', null)

  if (error) return { ok: false, cant: 0 }
  revalidatePath('/admin/notificaciones')
  return { ok: true, cant: count ?? 0 }
}
