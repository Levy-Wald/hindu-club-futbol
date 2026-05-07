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

  const [mensajesRes, countRes] = await Promise.all([
    supabase
      .from('com_mensajes')
      .select('id, asunto, cuerpo, tipo_severidad, action_url, leido_at, created_at')
      .eq('tenant_id', TENANT_ID)
      .eq('destinatario_persona_id', personaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('com_mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('destinatario_persona_id', personaId)
      .is('leido_at', null)
      .is('deleted_at', null),
  ])

  return NextResponse.json({
    mensajes: mensajesRes.data ?? [],
    count_no_leidos: countRes.count ?? 0,
  })
}
