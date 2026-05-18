import { NextResponse } from 'next/server'
import { fetchTrayectoriaPorPersona, fetchLogrosPorPersona } from '@/modules/historial-deportivo/lib/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { personaId } = await params
  const [trayectoria, logros] = await Promise.all([
    fetchTrayectoriaPorPersona(personaId),
    fetchLogrosPorPersona(personaId),
  ])
  return NextResponse.json({ trayectoria, logros })
}
