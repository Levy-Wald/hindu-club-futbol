import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET(req: NextRequest) {
  const personaId = req.nextUrl.searchParams.get('personaId')
  if (!personaId) return NextResponse.json({ data: null })

  const supabase = await createClient()
  const { data: sub } = await (supabase as any)
    .from('suscripciones')
    .select('tipo, estado, monto_pactado, plan:plan_id(nombre)')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .in('estado', ['activa', 'suspendida'])
    .limit(1)
    .maybeSingle()

  if (!sub) return NextResponse.json({ data: null })

  const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan

  const { data: proxCuota } = await (supabase as any)
    .from('cuotas_emitidas')
    .select('fecha_vencimiento, monto')
    .eq('persona_id', personaId)
    .eq('estado', 'pendiente')
    .order('fecha_vencimiento', { ascending: true })
    .limit(1)
    .maybeSingle()

  const response = NextResponse.json({
    data: {
      plan_nombre: plan?.nombre ?? sub.tipo ?? 'Membresía',
      estado: sub.estado,
      proxima_cuota_fecha: proxCuota?.fecha_vencimiento ?? null,
      proxima_cuota_monto: proxCuota?.monto ?? null,
    },
  })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}
