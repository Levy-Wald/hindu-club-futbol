import { fetchContratos } from '@/modules/rrhh/lib/queries'
import { ContratosFilters } from '@/modules/rrhh/ui/components/contratos-filters'
import { NuevoContratoDialog } from '@/modules/rrhh/ui/components/nuevo-contrato-dialog'
import { ContratosTable } from '@/modules/rrhh/ui/components/contratos-table'

interface PageProps {
  searchParams: Promise<{
    modalidad?: string
    estado?: string
    q?: string
  }>
}

export default async function ContratosPage({ searchParams }: PageProps) {
  const filters = await searchParams

  const contratos = await fetchContratos({
    modalidad: filters.modalidad,
    estado: filters.estado,
    search: filters.q,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Contratos</h1>
        <NuevoContratoDialog />
      </div>

      <ContratosFilters />

      <ContratosTable contratos={contratos as any} />
    </div>
  )
}
