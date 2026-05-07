import { Suspense } from 'react'
import Link from 'next/link'
import { fetchPadronesConConteo } from './_lib/queries'
import { PadronesTable } from './_components/padrones-table'
import { CrearPadronDialog } from './_components/crear-padron-dialog'
import { PadronesSearch } from './_components/padrones-search'
import { PadronesFilters } from './_components/padrones-filters'
import { VistasPanel } from '@/components/ui/vistas-panel'
import { PADRONES_LIST_MODULES, PADRONES_LIST_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { GitCompareArrows, RefreshCw } from 'lucide-react'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function PadronesPage({ searchParams }: Props) {
  const sp = await searchParams
  const search = sp.q
  const tipo = sp.tipo
  const activo = sp.activo

  const padrones = await fetchPadronesConConteo({ search, tipo, activo })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Padrones</h1>
        <div className="flex items-center gap-2">
          <VistasPanel modulo="padrones" modules={PADRONES_LIST_MODULES} defaultColumns={PADRONES_LIST_DEFAULT_COLUMNS} storageKey="padrones-columns" />
          <DownloadTemplateButton
            headers={['nombre', 'tipo', 'disciplina_slug', 'es_externo']}
            filename="modelo_padrones.csv"
            sampleRow={['Socios Activos', 'global', '', 'false']}
          />
          <Link href="/admin/padrones/sincronizar">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
          </Link>
          <Link href="/admin/padrones/comparar">
            <Button variant="outline" size="sm">
              <GitCompareArrows className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Comparar</span>
            </Button>
          </Link>
          <CrearPadronDialog />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Suspense>
          <PadronesSearch />
        </Suspense>
        <Suspense>
          <PadronesFilters />
        </Suspense>
      </div>

      <PadronesTable padrones={padrones} />
    </div>
  )
}
