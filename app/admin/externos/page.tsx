import { fetchEntidades } from './_lib/queries'
import { EntidadesTable, ENTIDADES_COLUMN_DEFS } from './_components/entidades-table'
import { CrearEntidadDialog } from './_components/crear-entidad-dialog'
import { ExportEntidadesButton } from './_components/export-entidades-button'
import { GenericColumnConfig } from '@/components/ui/column-config-generic'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'

export default async function ExternosPage() {
  const entidades = await fetchEntidades()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Entidades externas</h1>
        <div className="flex items-center gap-2">
          <GenericColumnConfig storageKey="entidades-columns" columns={ENTIDADES_COLUMN_DEFS} />
          <DownloadTemplateButton
            headers={['nombre', 'tipo', 'telefono', 'email', 'sitio_web', 'cuit', 'razon_social']}
            filename="modelo_entidades.csv"
            sampleRow={['Club Atlético River Plate', 'club', '011-4789-1234', 'contacto@river.com.ar', 'www.cariverplate.com.ar', '30-12345678-9', 'Club Atlético River Plate']}
          />
          <ExportEntidadesButton entidades={entidades} />
          <CrearEntidadDialog />
        </div>
      </div>

      <EntidadesTable entidades={entidades} />
    </div>
  )
}
