import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET() {
  const supabase = await createClient()

  const [preInscRes, cuotasRes] = await Promise.all([
    (supabase as any)
      .from('pre_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'pendiente'),
    (supabase as any)
      .from('cuotas_emitidas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'vencido'),
  ])

  const response = NextResponse.json({
    data: {
      pre_inscripciones_pendientes: preInscRes.count ?? 0,
      cuotas_vencidas: cuotasRes.count ?? 0,
    },
  })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}
