import { fetchEntidades } from './_lib/queries'
import { EntidadesTable, ENTIDADES_COLUMN_DEFS } from './_components/entidades-table'
import { CrearEntidadDialog } from './_components/crear-entidad-dialog'
import { ExportEntidadesButton } from './_components/export-entidades-button'
import { GenericColumnConfig } from '@/components/ui/column-config-generic'

export default async function ExternosPage() {
  const entidades = await fetchEntidades()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Entidades externas</h1>
        <div className="flex items-center gap-2">
          <GenericColumnConfig storageKey="entidades-columns" columns={ENTIDADES_COLUMN_DEFS} />
          <ExportEntidadesButton entidades={entidades} />
          <CrearEntidadDialog />
        </div>
      </div>

      <EntidadesTable entidades={entidades} />
    </div>
  )
}
