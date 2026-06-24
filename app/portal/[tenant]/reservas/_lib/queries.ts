// F3 portal — Reservas del socio.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { listarCanchasDisponibles } from '@/modules/reservas/lib/queries'

export interface CanchaOption {
  id: string
  nombre: string
  tipo: string | null
  precio_alquiler_hora: number | null
  sede_nombre: string | null
}

export async function fetchCanchas(): Promise<CanchaOption[]> {
  return listarCanchasDisponibles(TENANT_ID)
}

export interface MiReserva {
  id: string
  estado: string
  tarifa_total: number | null
  cancha_nombre: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
}

export async function fetchMisReservas(personaId: string): Promise<MiReserva[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservas_canchas')
    .select('id, estado, tarifa_total, cancha:canchas!cancha_id(nombre), evento:eventos!evento_id(fecha, hora_inicio, hora_fin)')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []).map((r) => {
    const ev = r.evento as unknown as { fecha: string | null; hora_inicio: string | null; hora_fin: string | null } | null
    return {
      id: r.id,
      estado: r.estado,
      tarifa_total: r.tarifa_total == null ? null : Number(r.tarifa_total),
      cancha_nombre: (r.cancha as unknown as { nombre: string } | null)?.nombre ?? null,
      fecha: ev?.fecha ?? null,
      hora_inicio: ev?.hora_inicio ?? null,
      hora_fin: ev?.hora_fin ?? null,
    }
  })
}
