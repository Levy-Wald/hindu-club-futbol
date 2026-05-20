import { NextRequest, NextResponse } from 'next/server'
import { resolverSegmento } from '@/modules/comunicaciones/lib/segmentos/resolver'
import type { SegmentoConfig } from '@/modules/comunicaciones/lib/segmentos/tipos'
import { TENANT_ID } from '@/lib/tenant'


export async function POST(request: NextRequest) {
  const body = await request.json()
  const segmento = body.segmento as SegmentoConfig
  const canal = body.canal as string

  try {
    const resultado = await resolverSegmento(TENANT_ID, segmento)
    const sin_email = canal === 'email'
      ? resultado.personas.filter(p => !p.email_principal).length
      : 0

    return NextResponse.json({
      total: resultado.total,
      sin_email,
    })
  } catch {
    return NextResponse.json({ total: 0, sin_email: 0 })
  }
}
