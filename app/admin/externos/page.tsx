import { fetchEntidades } from './_lib/queries'
import { EntidadesTable } from './_components/entidades-table'
import { CrearEntidadDialog } from './_components/crear-entidad-dialog'

export default async function ExternosPage() {
  const entidades = await fetchEntidades()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Entidades externas</h1>
        <CrearEntidadDialog />
      </div>

      <EntidadesTable entidades={entidades} />
    </div>
  )
}
