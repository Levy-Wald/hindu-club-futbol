'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

type EstadoCitado = 'titular' | 'suplente' | 'convocado'

// Guarda la convocatoria de un partido haciendo un DIFF (no delete+insert) para
// PRESERVAR la respuesta del jugador (confirmó/rechazó) cuando sigue convocado:
// - persona nueva en la convocatoria → insert (respuesta 'pendiente') + se le notifica.
// - persona que sigue → update del estado, sin tocar su respuesta.
// - persona que sale → delete.
export async function guardarConvocatoria(
  eventoId: string,
  convocados: Array<{ persona_id: string; estado: EstadoCitado | null }>,
) {
  const supabase = await createClient()

  const deseados = new Map<string, EstadoCitado>()
  for (const c of convocados) {
    if (c.estado !== null) deseados.set(c.persona_id, c.estado)
  }

  // Estado actual en BD
  const { data: actuales, error: selErr } = await supabase
    .from('evento_convocados')
    .select('persona_id, estado')
    .eq('evento_id', eventoId)
  if (selErr) return formatResult(false, selErr.message)

  const actualesMap = new Map<string, EstadoCitado>()
  for (const a of (actuales ?? []) as { persona_id: string; estado: EstadoCitado }[]) {
    actualesMap.set(a.persona_id, a.estado)
  }

  const aInsertar = [...deseados.entries()].filter(([pid]) => !actualesMap.has(pid))
  const aActualizar = [...deseados.entries()].filter(([pid, est]) => actualesMap.has(pid) && actualesMap.get(pid) !== est)
  const aBorrar = [...actualesMap.keys()].filter((pid) => !deseados.has(pid))

  // Insert nuevos (respuesta queda 'pendiente' por default de la columna)
  if (aInsertar.length > 0) {
    const { error } = await supabase.from('evento_convocados').insert(
      aInsertar.map(([persona_id, estado]) => ({ tenant_id: TENANT_ID, evento_id: eventoId, persona_id, estado })),
    )
    if (error) return formatResult(false, error.message)
  }

  // Update de estado (preserva respuesta)
  for (const [persona_id, estado] of aActualizar) {
    const { error } = await supabase
      .from('evento_convocados')
      .update({ estado })
      .eq('evento_id', eventoId)
      .eq('persona_id', persona_id)
    if (error) return formatResult(false, error.message)
  }

  // Borrar los que salieron
  if (aBorrar.length > 0) {
    const { error } = await supabase
      .from('evento_convocados')
      .delete()
      .eq('evento_id', eventoId)
      .in('persona_id', aBorrar)
    if (error) return formatResult(false, error.message)
  }

  // Notificar a los recién convocados (in-app)
  if (aInsertar.length > 0) {
    const { data: evento } = await supabase
      .from('eventos')
      .select('titulo, fecha_inicio')
      .eq('id', eventoId)
      .maybeSingle()
    const generadaPor = await getCurrentPersonaId()
    const partido = evento?.titulo ?? 'un partido'
    const cuando = evento?.fecha_inicio
      ? new Date(evento.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
      : null
    await Promise.all(
      aInsertar.map(([persona_id, estado]) =>
        crearNotificacion({
          tenant_id: TENANT_ID,
          destinatario_persona_id: persona_id,
          tipo: 'convocatoria_recibida',
          titulo: `Te convocaron a ${partido}`,
          mensaje: `${estado === 'titular' ? 'Titular' : estado === 'suplente' ? 'Suplente' : 'Convocado'}${cuando ? ` · ${cuando}` : ''}. Confirmá tu disponibilidad.`,
          prioridad: 'alta',
          origen_tabla: 'evento_convocados',
          origen_registro_id: eventoId,
          origen_evento: 'convocatoria_guardada',
          generada_por_persona_id: generadaPor ?? undefined,
        }),
      ),
    )
  }

  revalidatePath('/admin/convocatorias')
  revalidatePath(`/admin/convocatorias/${eventoId}`)
  return formatResult(true, `Convocatoria guardada (${deseados.size} citados)`)
}
