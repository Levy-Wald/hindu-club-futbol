// F6.5 — BI Ejecutivo (Dashboard Director). Read-only sobre vistas analíticas ya
// existentes (RLS-safe vía security_invoker). Cero schema nuevo, cero dep externa.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface MembresiaPorTipo {
  tipo: string
  disciplina_slug: string | null
  activos: number
  dados_baja: number
  suspendidos: number
  ingreso_mensual_estimado: number
}

export interface VencimientoProximo {
  tipo: string
  titulo: string | null
  detalle: string | null
  vence: string | null
  dias_para_vencer: number | null
}

export interface BIEjecutivo {
  sociosActivos: number
  ingresoMensualEstimado: number
  montoCobrado: number
  montoPendiente: number
  cuotasVencidas: number
  jugadoresLesionados: number
  membresiasPorTipo: MembresiaPorTipo[]
  proximosVencimientos: VencimientoProximo[]
}

export async function fetchBIEjecutivo(): Promise<BIEjecutivo> {
  const supabase = await createClient()

  const [membresiasRes, cuotasRes, vencimientosRes, lesionadosRes] = await Promise.all([
    supabase
      .from('v_resumen_membresias')
      .select('tipo, disciplina_slug, activos, dados_baja, suspendidos, ingreso_mensual_estimado')
      .eq('tenant_id', TENANT_ID),
    supabase
      .from('v_cuotas_resumen_periodo')
      .select('cant_vencidas, monto_cobrado, monto_pendiente')
      .eq('tenant_id', TENANT_ID),
    supabase
      .from('v_vencimientos_proximos')
      .select('tipo, titulo, detalle, vence, dias_para_vencer')
      .eq('tenant_id', TENANT_ID)
      .order('dias_para_vencer', { ascending: true })
      .limit(10),
    supabase
      .from('v_personas_lesionadas_activas')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID),
  ])

  const membresias = (membresiasRes.data ?? []).map((m) => ({
    tipo: m.tipo ?? '—',
    disciplina_slug: m.disciplina_slug,
    activos: Number(m.activos ?? 0),
    dados_baja: Number(m.dados_baja ?? 0),
    suspendidos: Number(m.suspendidos ?? 0),
    ingreso_mensual_estimado: Number(m.ingreso_mensual_estimado ?? 0),
  }))

  const cuotas = cuotasRes.data ?? []

  return {
    sociosActivos: membresias.reduce((a, m) => a + m.activos, 0),
    ingresoMensualEstimado: membresias.reduce((a, m) => a + m.ingreso_mensual_estimado, 0),
    montoCobrado: cuotas.reduce((a, c) => a + Number(c.monto_cobrado ?? 0), 0),
    montoPendiente: cuotas.reduce((a, c) => a + Number(c.monto_pendiente ?? 0), 0),
    cuotasVencidas: cuotas.reduce((a, c) => a + Number(c.cant_vencidas ?? 0), 0),
    jugadoresLesionados: lesionadosRes.count ?? 0,
    membresiasPorTipo: membresias.sort((a, b) => b.activos - a.activos),
    proximosVencimientos: (vencimientosRes.data ?? []).map((v) => ({
      tipo: v.tipo,
      titulo: v.titulo,
      detalle: v.detalle,
      vence: v.vence,
      dias_para_vencer: v.dias_para_vencer == null ? null : Number(v.dias_para_vencer),
    })),
  }
}
