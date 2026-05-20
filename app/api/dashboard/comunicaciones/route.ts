import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET() {
  const supabase = await createClient()

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count, data } = await (supabase as any)
    .from('com_envios')
    .select('created_at', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .gte('created_at', inicioMes.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  const response = NextResponse.json({
    data: {
      total_enviados: count ?? 0,
      ultimo_envio: data?.[0]?.created_at ?? null,
    },
  })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}
