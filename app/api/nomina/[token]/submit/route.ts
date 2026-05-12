import { submitNominaPublicaAction } from '@/modules/nominas_externas/lib/actions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
  }

  const payload = body as {
    cargador_email?: string
    personas?: Array<{ nombre: string; apellido: string; [k: string]: unknown }>
    entidades?: Array<{ nombre: string; [k: string]: unknown }>
  }

  const result = await submitNominaPublicaAction({
    token,
    cargador_email: payload.cargador_email,
    personas: (payload.personas ?? []).map(p => ({
      nombre: String(p.nombre ?? ''),
      apellido: String(p.apellido ?? ''),
      dni: p.dni ? String(p.dni) : undefined,
      fecha_nacimiento: p.fecha_nacimiento ? String(p.fecha_nacimiento) : undefined,
      telefono: p.telefono ? String(p.telefono) : undefined,
      email: p.email ? String(p.email) : undefined,
      rol: p.rol ? String(p.rol) : undefined,
      notas: p.notas ? String(p.notas) : undefined,
    })),
    entidades: (payload.entidades ?? []).map(e => ({
      nombre: String(e.nombre ?? ''),
      contacto: e.contacto ? String(e.contacto) : undefined,
      notas: e.notas ? String(e.notas) : undefined,
    })),
  })

  const status = result.ok ? 200 : 400
  return Response.json(result, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
