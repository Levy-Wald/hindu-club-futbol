import { obtenerInfoPublicaPorToken } from '@/modules/nominas_externas/lib/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const info = await obtenerInfoPublicaPorToken(token)

  if (!info) {
    // S2: respuesta genérica, no leak de info
    return Response.json({ error: 'Link no válido o caducado' }, {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }

  return Response.json(info, {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
