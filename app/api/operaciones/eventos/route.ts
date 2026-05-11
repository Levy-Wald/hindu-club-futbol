import { NextRequest, NextResponse } from 'next/server'
import { fetchEventosSemana } from '@/app/admin/(troncal)/operaciones/_lib/queries'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const inicio = searchParams.get('inicio')
  const fin = searchParams.get('fin')

  if (!inicio || !fin) {
    return NextResponse.json(
      { error: 'Parametros inicio y fin son requeridos' },
      { status: 400 }
    )
  }

  try {
    const eventos = await fetchEventosSemana(inicio, fin)
    return NextResponse.json(eventos)
  } catch (err) {
    console.error('[API/operaciones/eventos] Error:', err)
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}
