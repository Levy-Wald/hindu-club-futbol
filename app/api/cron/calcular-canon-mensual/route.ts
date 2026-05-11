import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { crearNotificacion } from '@/lib/notificaciones/crear'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Calcular canon del mes anterior
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Get active concesionarios
  const { data: concesionarios } = await supabase
    .from('concesionarios')
    .select('id, nombre_comercial')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  let calculados = 0
  let errores = 0

  for (const c of concesionarios ?? []) {
    const { error } = await supabase.rpc('fn_calcular_canon_concesion', {
      p_concesionario_id: c.id,
      p_periodo: periodo,
    })

    if (error) {
      errores++
      continue
    }

    calculados++

    // Notificar admin
    crearNotificacion({
      tenant_id: TENANT_ID,
      destinatario_persona_id: '3d2d5902-9c10-4154-8086-316b0fbe081e',
      tipo: 'concesion_canon_calculado',
      titulo: `Canon ${periodo}: ${c.nombre_comercial}`,
      mensaje: `Se calculó el canon mensual de ${c.nombre_comercial} para el período ${periodo}.`,
      prioridad: 'media',
      origen_tabla: 'concesionarios',
      origen_registro_id: c.id,
      origen_evento: 'cron_calcular_canon',
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    periodo,
    calculados,
    errores,
    total_concesionarios: concesionarios?.length ?? 0,
  })
}
