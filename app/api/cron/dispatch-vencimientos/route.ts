import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificarPersona } from '@/modules/comunicaciones/lib/notificar'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface Vencimiento {
  persona_id: string
  tipo: string
  titulo: string | null
  detalle: string | null
  vence: string | null
  dias_para_vencer: number
  origen_id: string
}

export async function GET(request: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Consultar vencimientos proximos para dias criticos
  const { data: vencimientos } = await supabase
    .from('v_vencimientos_proximos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .in('dias_para_vencer', [30, 7, 1, 0, -1])

  let notificados = 0
  let errores = 0

  for (const v of (vencimientos ?? []) as Vencimiento[]) {
    // Determinar slug de plantilla segun tipo y dias
    let plantillaBase = ''
    if (v.tipo === 'cuota') {
      if (v.dias_para_vencer === 30) plantillaBase = 'cuota_vencimiento_30'
      else if (v.dias_para_vencer === 7) plantillaBase = 'cuota_vencimiento_7'
      else if (v.dias_para_vencer === 1) plantillaBase = 'cuota_vencimiento_1'
      else if (v.dias_para_vencer <= 0) plantillaBase = 'cuota_vencida'
    } else if (v.tipo === 'apto_fisico') {
      plantillaBase = 'apto_vencimiento'
    } else if (v.tipo === 'autorizacion') {
      plantillaBase = 'autorizacion_vencimiento'
    }

    // Saltar tipos sin plantilla definida
    if (!plantillaBase) continue

    // Idempotencia: no enviar la misma notificacion dos veces en el mismo dia
    const hoy = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('com_envios')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', v.persona_id)
      .eq('origen_entidad_id', v.origen_id)
      .like('plantilla_slug', plantillaBase + '%')
      .gte('created_at', hoy + 'T00:00:00')

    if ((count ?? 0) > 0) continue // Ya notificado hoy

    // Determinar canales segun urgencia
    const canales: ('inapp' | 'email')[] =
      v.dias_para_vencer === 1 ? ['inapp'] : ['inapp', 'email']

    // Obtener nombre de la persona para variables
    const { data: persona } = await supabase
      .from('personas')
      .select('nombre')
      .eq('id', v.persona_id)
      .single()

    const variables: Record<string, string> = {
      nombre: persona?.nombre || '',
      fecha_vencimiento: v.vence || '',
      ...(v.detalle ? { monto: v.detalle } : {}),
      ...(v.titulo ? { plan_nombre: v.titulo, tipo_autorizacion: v.titulo } : {}),
      club_nombre: 'Hindu Club',
    }

    try {
      const result = await notificarPersona(v.persona_id, plantillaBase, variables, canales)

      // Actualizar envios con origen_entidad_id para futura idempotencia
      if (result.success) {
        await supabase
          .from('com_envios')
          .update({ origen_entidad_id: v.origen_id, origen_modulo_slug: v.tipo })
          .eq('tenant_id', TENANT_ID)
          .eq('persona_id', v.persona_id)
          .like('plantilla_slug', plantillaBase + '%')
          .gte('created_at', hoy + 'T00:00:00')
          .is('origen_entidad_id', null)
      }

      // Also create in new notificaciones table
      const tipoMap: Record<string, string> = {
        cuota_vencimiento_30: 'cuota_proxima_vencer',
        cuota_vencimiento_7: 'cuota_proxima_vencer',
        cuota_vencimiento_1: 'cuota_proxima_vencer',
        cuota_vencida: 'cuota_vencida',
        apto_vencimiento: 'apto_medico_proximo_vencer',
        autorizacion_vencimiento: 'autorizacion_proxima_vencer',
      }
      const tipoNotif = tipoMap[plantillaBase]
      if (tipoNotif) {
        crearNotificacion({
          tenant_id: TENANT_ID,
          destinatario_persona_id: v.persona_id,
          tipo: tipoNotif as Parameters<typeof crearNotificacion>[0]['tipo'],
          titulo: variables.nombre ? `${variables.nombre}: ${v.titulo ?? plantillaBase}` : (v.titulo ?? plantillaBase),
          mensaje: `${v.detalle ?? ''} — Vence: ${v.vence ?? 'pronto'}`,
          prioridad: v.dias_para_vencer <= 1 ? 'alta' : 'media',
          origen_tabla: v.tipo === 'cuota' ? 'cuotas_emitidas' : v.tipo === 'apto_fisico' ? 'personas_datos_medicos' : 'personas_autorizaciones',
          origen_registro_id: v.origen_id,
          origen_evento: `cron_vencimientos_${plantillaBase}`,
        }).catch(() => {})
      }

      notificados++
    } catch {
      errores++
    }
  }

  return NextResponse.json({
    ok: true,
    notificados,
    errores,
    total_vencimientos: vencimientos?.length ?? 0,
  })
}
