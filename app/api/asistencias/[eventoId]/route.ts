import { NextRequest, NextResponse } from 'next/server'
import { fetchAsistenciasEvento } from '@/app/admin/[tenant]/(troncal)/operaciones/_lib/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventoId: string }> }
) {
  try {
    const { eventoId } = await params
    const asistencias = await fetchAsistenciasEvento(eventoId)
    return NextResponse.json(asistencias)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}
