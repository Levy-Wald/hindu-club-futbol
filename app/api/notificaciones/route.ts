import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET(request: NextRequest) {
  const personaId = request.nextUrl.searchParams.get('persona_id')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

  if (!personaId) {
    return NextResponse.json({ error: 'persona_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const [notifsRes, countRes] = await Promise.all([
    supabase
      .from('notificaciones')
      .select('id, titulo, mensaje, prioridad, link_accion, leida_at, created_at, tipo_slug')
      .eq('tenant_id', TENANT_ID)
      .eq('destinatario_persona_id', personaId)
      .is('archivada_at', null)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('destinatario_persona_id', personaId)
      .is('leida_at', null)
      .is('archivada_at', null),
  ])

  return NextResponse.json({
    notifs: notifsRes.data ?? [],
    count_no_leidos: countRes.count ?? 0,
  })
}
