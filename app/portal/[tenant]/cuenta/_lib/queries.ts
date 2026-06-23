// F3 — Portal Cliente / Mi cuenta. Reutiliza el modelo financiero de mi-cuenta
// (admin), filtrado siempre por la persona propia.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface CuotaSocio {
  id: string
  periodo: string | null
  monto_final: number
  moneda: string
  estado: string
  fecha_vencimiento: string | null
}

export interface MovimientoSocio {
  id: string
  numero: string | null
  tipo: string
  monto_neto: number
  moneda: string
  fecha: string
  descripcion: string | null
}

export interface MiCuentaResumen {
  saldo: number
  saldo_usd: number
  cuotas: CuotaSocio[]
  movimientos: MovimientoSocio[]
}

export async function fetchMiCuentaResumen(personaId: string): Promise<MiCuentaResumen> {
  const supabase = await createClient()

  const [cuentaRes, cuotasRes, movimientosRes] = await Promise.all([
    supabase
      .from('cuentas_corrientes')
      .select('saldo, saldo_usd')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', personaId)
      .eq('tipo', 'socio')
      .maybeSingle(),
    supabase
      .from('cuotas_emitidas')
      .select('id, periodo, monto_final, moneda, estado, fecha_vencimiento')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', personaId)
      .order('fecha_vencimiento', { ascending: false })
      .limit(50),
    supabase
      .from('movimientos_caja')
      .select('id, numero, tipo, monto_neto, moneda, fecha, descripcion')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', personaId)
      .eq('anulado', false)
      .order('fecha', { ascending: false })
      .limit(30),
  ])

  return {
    saldo: Number(cuentaRes.data?.saldo ?? 0),
    saldo_usd: Number(cuentaRes.data?.saldo_usd ?? 0),
    cuotas: (cuotasRes.data ?? []).map((c) => ({
      id: c.id,
      periodo: c.periodo,
      monto_final: Number(c.monto_final ?? 0),
      moneda: c.moneda ?? 'ARS',
      estado: c.estado,
      fecha_vencimiento: c.fecha_vencimiento,
    })),
    movimientos: (movimientosRes.data ?? []).map((m) => ({
      id: m.id,
      numero: m.numero,
      tipo: m.tipo,
      monto_neto: Number(m.monto_neto ?? 0),
      moneda: m.moneda ?? 'ARS',
      fecha: m.fecha,
      descripcion: m.descripcion,
    })),
  }
}
