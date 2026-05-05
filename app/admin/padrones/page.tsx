import Link from 'next/link'
import { fetchPadronesConConteo } from './_lib/queries'
import { PadronesTable, PADRONES_COLUMN_DEFS } from './_components/padrones-table'
import { CrearPadronDialog } from './_components/crear-padron-dialog'
import { GenericColumnConfig } from '@/components/ui/column-config-generic'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { GitCompareArrows } from 'lucide-react'

export default async function PadronesPage() {
  const padrones = await fetchPadronesConConteo()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Padrones</h1>
        <div className="flex items-center gap-2">
          <GenericColumnConfig storageKey="padrones-columns" columns={PADRONES_COLUMN_DEFS} />
          <DownloadTemplateButton
            headers={['nombre', 'tipo', 'disciplina_slug', 'es_externo']}
            filename="modelo_padrones.csv"
            sampleRow={['Socios Activos', 'global', '', 'false']}
          />
          <Link href="/admin/padrones/comparar">
            <Button variant="outline" size="sm">
              <GitCompareArrows className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Comparar</span>
            </Button>
          </Link>
          <CrearPadronDialog />
        </div>
      </div>

      <PadronesTable padrones={padrones} />
    </div>
  )
}
