// F3 — Portal Cliente (front del socio). Queries del resumen del socio.
// Siempre se filtra por persona_id propio: la RLS aísla por tenant, y el filtro
// explícito por persona garantiza que el socio solo ve SUS datos.
import { createClient } from '@/lib/supabase/server'

export interface SocioResumen {
  persona: {
    id: string
    nombre: string
    apellido: string
    foto_perfil_url: string | null
  }
  membresia: {
    numero_socio: string | null
    padron_nombre: string | null
    fecha_alta: string | null
    activo: boolean
  } | null
  saldo: number
  proximaCuota: {
    periodo: string | null
    monto: number
    moneda: string
    fecha_vencimiento: string | null
    estado: string
  } | null
}

export async function fetchSocioResumen(personaId: string): Promise<SocioResumen | null> {
  const supabase = await createClient()

  const { data: persona, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, foto_perfil_url')
    .eq('id', personaId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error || !persona) return null

  const [{ data: padron }, { data: cuenta }, { data: cuotas }] = await Promise.all([
    supabase
      .from('personas_padrones')
      .select('numero_socio, fecha_alta, activo, padron:padrones(nombre)')
      .eq('persona_id', personaId)
      .eq('activo', true)
      .order('fecha_alta', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('cuentas_corrientes')
      .select('saldo')
      .eq('persona_id', personaId)
      .order('ultimo_movimiento_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('cuotas_emitidas')
      .select('periodo, monto_final, moneda, fecha_vencimiento, estado')
      .eq('persona_id', personaId)
      .not('estado', 'in', '("pagada","anulada")')
      .order('fecha_vencimiento', { ascending: true })
      .limit(1),
  ])

  const proxima = (cuotas ?? [])[0]

  return {
    persona,
    membresia: padron
      ? {
          numero_socio: padron.numero_socio,
          padron_nombre: (padron.padron as unknown as { nombre: string } | null)?.nombre ?? null,
          fecha_alta: padron.fecha_alta,
          activo: padron.activo,
        }
      : null,
    saldo: Number(cuenta?.saldo ?? 0),
    proximaCuota: proxima
      ? {
          periodo: proxima.periodo,
          monto: Number(proxima.monto_final ?? 0),
          moneda: proxima.moneda ?? 'ARS',
          fecha_vencimiento: proxima.fecha_vencimiento,
          estado: proxima.estado,
        }
      : null,
  }
}
