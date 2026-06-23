import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ejecutarRecordatoriosEventos } from '@/modules/eventos/lib/recordatorios'
import { TENANT_ID } from '@/lib/tenant'

// F1.4 — Cron horario: dispara las notificaciones in-app de recordatorios de
// eventos próximos. Auth con CRON_SECRET (patrón de los otros crons).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  try {
    const result = await ejecutarRecordatoriosEventos(supabase, TENANT_ID)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
