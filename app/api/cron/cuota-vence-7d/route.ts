import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ejecutarCuotaVence7d } from '@/modules/comunicaciones/lib/triggers/cuota-vence-7d'
import { TENANT_ID } from '@/lib/tenant'


export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const jobId = crypto.randomUUID()

  await supabase.from('com_jobs_log').insert({
    id: jobId,
    tenant_id: TENANT_ID,
    job_slug: 'cuota_vence_7d',
    status: 'running',
  })

  try {
    const result = await ejecutarCuotaVence7d(supabase, TENANT_ID, jobId)

    await supabase.from('com_jobs_log').update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      personas_encontradas: result.personas_encontradas,
      personas_notificadas: result.personas_notificadas,
      personas_dedup: result.personas_dedup,
      errores: result.errores,
      metadata: { lote_id: result.lote_id, detalles: result.detalles },
    }).eq('id', jobId)

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'

    await supabase.from('com_jobs_log').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      metadata: { error: errorMsg },
    }).eq('id', jobId)

    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
