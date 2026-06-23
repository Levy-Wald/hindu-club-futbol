import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'
import type { Recordatorio } from './types'
import { inicioEventoMs, recordatorioDispara } from './recordatorios-logica'

// F1.4 — Procesa los recordatorios de eventos próximos y dispara la notificación
// IN-APP a responsables + invitados aceptados. Pensado para correr por cron
// (horario). Dispara cuando "ahora" cae en la ventana [fireTime, fireTime+VENTANA)
// con fireTime = inicio_del_evento - minutos_antes. El dedup de crearNotificacion
// (por tenant+destinatario+tipo+origen en 24h) evita duplicados entre ticks, así
// que no hace falta tabla de log ni migración.

const DIAS_HORIZONTE = 31

export type ResultadoRecordatorios = {
  eventos_revisados: number
  recordatorios_disparados: number
  notificaciones_creadas: number
}

export async function ejecutarRecordatoriosEventos(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tenantId: string,
  ahoraMs: number = Date.now(),
): Promise<ResultadoRecordatorios> {
  const hoy = new Date(ahoraMs).toISOString().slice(0, 10)
  const hasta = new Date(ahoraMs + DIAS_HORIZONTE * 86_400_000).toISOString().slice(0, 10)

  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, fecha_inicio, hora_inicio, recordatorios, responsables_persona_id')
    .eq('tenant_id', tenantId)
    .eq('estado', 'programado')
    .is('deleted_at', null)
    .gte('fecha_inicio', hoy)
    .lte('fecha_inicio', hasta)
    .limit(5000)

  let disparados = 0
  let creadas = 0

  for (const ev of eventos ?? []) {
    const recordatorios = (ev.recordatorios ?? []) as Recordatorio[]
    const habilitados = recordatorios.filter(
      (r) => r && r.habilitado && typeof r.minutos_antes === 'number',
    )
    if (habilitados.length === 0) continue

    const startMs = inicioEventoMs(ev.fecha_inicio as string, ev.hora_inicio as string | null)
    if (!recordatorioDispara(startMs, habilitados, ahoraMs)) continue
    disparados++

    // Destinatarios: responsables + invitados aceptados
    const destinatarios = new Set<string>(
      ((ev.responsables_persona_id ?? []) as string[]).filter(Boolean),
    )
    const { data: aceptados } = await supabase
      .from('evento_invitados')
      .select('persona_id')
      .eq('evento_id', ev.id)
      .eq('estado_invitacion', 'aceptado')
      .not('persona_id', 'is', null)
      .is('deleted_at', null)
    for (const a of aceptados ?? []) {
      if (a.persona_id) destinatarios.add(a.persona_id as string)
    }

    const horaTxt = ev.hora_inicio ? ` a las ${(ev.hora_inicio as string).slice(0, 5)}` : ''
    for (const personaId of destinatarios) {
      const res = await crearNotificacion({
        tenant_id: tenantId,
        destinatario_persona_id: personaId,
        tipo: 'evento_recordatorio',
        titulo: `Recordatorio: ${ev.titulo ?? 'Evento'}`,
        mensaje: `Tenés "${ev.titulo ?? 'un evento'}" el ${ev.fecha_inicio}${horaTxt}.`,
        link_accion: `/admin/${tenantId}/mi-calendario`,
        prioridad: 'media',
        origen_tabla: 'eventos',
        origen_registro_id: ev.id,
        origen_evento: 'evento_recordatorio',
      })
      if (res.ok) creadas++
    }
  }

  return {
    eventos_revisados: eventos?.length ?? 0,
    recordatorios_disparados: disparados,
    notificaciones_creadas: creadas,
  }
}
