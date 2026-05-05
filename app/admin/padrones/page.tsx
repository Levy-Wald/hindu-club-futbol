import { fetchPadronesConConteo } from './_lib/queries'
import { PadronesTable } from './_components/padrones-table'
import { CrearPadronDialog } from './_components/crear-padron-dialog'

export default async function PadronesPage() {
  const padrones = await fetchPadronesConConteo()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Padrones</h1>
        <CrearPadronDialog />
      </div>

      <PadronesTable padrones={padrones} />
    </div>
  )
}
