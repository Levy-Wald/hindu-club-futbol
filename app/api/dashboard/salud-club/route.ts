import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET() {
  const supabase = await createClient()

  const { count } = await (supabase as any)
    .from('personas_lesiones')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('recuperada', false)
    .is('deleted_at', null)

  return NextResponse.json({
    data: { lesionados_activos: count ?? 0 },
  })
}
