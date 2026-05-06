import { Suspense } from 'react'
import { fetchScoutingFichas } from './_lib/queries'
import { fetchEquiposActivos } from '../_lib/queries'
import { ScoutingTable } from './_components/scouting-table'
import { CrearScoutingDialog } from './_components/crear-scouting-dialog'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ScoutingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.q ?? ''
  const estado = params.estado ?? ''
  const equipoId = params.equipo ?? ''

  const [fichas, equipos] = await Promise.all([
    fetchScoutingFichas({ search, estado, equipo_id: equipoId }),
    fetchEquiposActivos(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Scouting</h1>
        <CrearScoutingDialog equipos={equipos} />
      </div>

      <Suspense>
        <ScoutingTable fichas={fichas} equipos={equipos} />
      </Suspense>
    </div>
  )
}
