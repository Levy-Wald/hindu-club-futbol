import { fetchPadronesConConteo } from './_lib/queries'
import { PadronesTable, PADRONES_COLUMN_DEFS } from './_components/padrones-table'
import { CrearPadronDialog } from './_components/crear-padron-dialog'
import { GenericColumnConfig } from '@/components/ui/column-config-generic'

export default async function PadronesPage() {
  const padrones = await fetchPadronesConConteo()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Padrones</h1>
        <div className="flex items-center gap-2">
          <GenericColumnConfig storageKey="padrones-columns" columns={PADRONES_COLUMN_DEFS} />
          <CrearPadronDialog />
        </div>
      </div>

      <PadronesTable padrones={padrones} />
    </div>
  )
}
