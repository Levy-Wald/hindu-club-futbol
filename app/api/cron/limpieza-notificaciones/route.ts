import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('fn_limpieza_notificaciones_old')

  if (error) {
    console.error('Error limpieza notificaciones:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    ok: true,
    archivadas: result?.archivadas ?? 0,
    borradas: result?.borradas ?? 0,
  })
}
