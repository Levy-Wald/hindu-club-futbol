import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET(req: NextRequest) {
  const personaId = req.nextUrl.searchParams.get('personaId')
  if (!personaId) return NextResponse.json({ data: [] })

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('personas_equipos')
    .select('rol_equipo_slug, equipo:equipo_id(nombre, categoria:categoria_id(nombre_display))')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('activo', true)
    .is('deleted_at', null)

  const equipos = (data ?? []).map((pe: any) => {
    const eq = Array.isArray(pe.equipo) ? pe.equipo[0] : pe.equipo
    const cat = eq?.categoria
      ? Array.isArray(eq.categoria)
        ? eq.categoria[0]
        : eq.categoria
      : null
    return {
      equipo_nombre: eq?.nombre ?? 'Equipo',
      categoria_nombre: cat?.nombre_display ?? null,
      rol: pe.rol_equipo_slug ?? 'miembro',
    }
  })

  return NextResponse.json({ data: equipos })
}
