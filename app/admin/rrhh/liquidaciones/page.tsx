import { createClient } from '@/lib/supabase/server'
import { fetchLiquidaciones, fetchCajasParaLiquidacion } from '../_lib/queries'
import { LiquidacionesFilters } from './_components/liquidaciones-filters'
import { NuevaLiquidacionDialog } from './_components/nueva-liquidacion-dialog'
import { LiquidacionesTable } from './_components/liquidaciones-table'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface PageProps {
  searchParams: Promise<{
    periodo?: string
    estado?: string
    q?: string
  }>
}

export default async function LiquidacionesPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createClient()

  const liquidacionesRaw = await fetchLiquidaciones({
    periodo: filters.periodo,
    estado: filters.estado,
  })

  // Filtro por nombre de persona (post-query)
  let liquidaciones = liquidacionesRaw
  if (filters.q) {
    const searchLower = filters.q.toLowerCase()
    liquidaciones = liquidaciones.filter((liq) => {
      const personaRaw = liq.persona as unknown
      const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as {
        nombre: string
        apellido: string
      } | null
      if (!persona) return false
      return (
        persona.nombre?.toLowerCase().includes(searchLower) ||
        persona.apellido?.toLowerCase().includes(searchLower)
      )
    })
  }

  // Fetch contratos vigentes para el dialog de nueva liquidacion
  const { data: contratosVigentes } = await supabase
    .from('rrhh_contratos')
    .select(`
      id, modalidad, monto, moneda,
      persona:personas(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'vigente')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const cajas = await fetchCajasParaLiquidacion()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Liquidaciones</h1>
        <NuevaLiquidacionDialog contratos={contratosVigentes ?? []} />
      </div>

      <LiquidacionesFilters filtrosActuales={filters} />

      <LiquidacionesTable liquidaciones={liquidaciones as any} cajas={cajas as any} />
    </div>
  )
}
