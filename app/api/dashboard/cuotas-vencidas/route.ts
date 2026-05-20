import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET() {
  const supabase = await createClient()

  const { data, count } = await (supabase as any)
    .from('cuotas_emitidas')
    .select('persona_id, monto', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'vencido')

  const rows = data ?? []
  const deudores = new Set(rows.map((r: { persona_id: string }) => r.persona_id))
  const montoTotal = rows.reduce((sum: number, r: { monto: number }) => sum + (r.monto ?? 0), 0)

  const response = NextResponse.json({
    data: {
      total_vencidas: count ?? 0,
      total_deudores: deudores.size,
      monto_total: montoTotal,
    },
  })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}
