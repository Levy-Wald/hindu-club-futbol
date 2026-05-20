import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET(req: NextRequest) {
  const personaId = req.nextUrl.searchParams.get('personaId')
  if (!personaId) return NextResponse.json({ data: [] })

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('proyecto_tareas')
    .select('id, titulo, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('responsable_id', personaId)
    .not('estado', 'eq', 'completado')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  const response = NextResponse.json({ data: data ?? [] })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}
