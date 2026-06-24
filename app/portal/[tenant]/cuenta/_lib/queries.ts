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

// Membresía del socio: padrón(es) donde está, tipo de socio, estado y nº de socio.
export interface MembresiaSocio {
  padron: string | null
  tipo_socio: string | null
  estado: string | null
  numero_socio: string | null
  categoria: string | null
  actividad: string | null
}

export async function fetchMiMembresia(personaId: string): Promise<MembresiaSocio[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas_padrones')
    .select(`
      numero_socio, categoria_club, actividad_club,
      padron:padrones(nombre),
      tipo:catalogo_tipos_socio(nombre),
      estado:catalogo_estados_padron(nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('activo', true)

  return (data ?? []).map((p) => {
    const padron = p.padron as unknown as { nombre: string } | null
    const tipo = p.tipo as unknown as { nombre: string } | null
    const estado = p.estado as unknown as { nombre: string } | null
    return {
      padron: padron?.nombre ?? null,
      tipo_socio: tipo?.nombre ?? null,
      estado: estado?.nombre ?? null,
      numero_socio: p.numero_socio ?? null,
      categoria: p.categoria_club ?? null,
      actividad: p.actividad_club ?? null,
    }
  })
}

// Datos de contacto del club (administración) desde el branding público.
export interface ContactoClub {
  telefono: string | null
  whatsapp: string | null
  email: string | null
  direccion: string | null
}

export async function fetchContactoClub(): Promise<ContactoClub> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_config_publica')
    .select('telefono, whatsapp, email_contacto, direccion')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()
  return {
    telefono: data?.telefono ?? null,
    whatsapp: data?.whatsapp ?? null,
    email: data?.email_contacto ?? null,
    direccion: data?.direccion ?? null,
  }
}
