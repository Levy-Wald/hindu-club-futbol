import Link from 'next/link'
import { fetchEntidades } from './_lib/queries'
import { EntidadesTable } from './_components/entidades-table'
import { CrearEntidadDialog } from './_components/crear-entidad-dialog'
import { ExportEntidadesButton } from './_components/export-entidades-button'
import { VistasPanel } from '@/components/ui/vistas-panel'
import { EXTERNOS_MODULES, EXTERNOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default async function ExternosPage() {
  const entidades = await fetchEntidades()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Entidades externas</h1>
        <div className="flex items-center gap-2">
          <VistasPanel modulo="externos" modules={EXTERNOS_MODULES} defaultColumns={EXTERNOS_DEFAULT_COLUMNS} storageKey="entidades-columns" />
          <DownloadTemplateButton
            headers={['nombre', 'tipo', 'telefono', 'email', 'sitio_web', 'cuit', 'razon_social']}
            filename="modelo_entidades.csv"
            sampleRow={['Club Atlético River Plate', 'club', '011-4789-1234', 'contacto@river.com.ar', 'www.cariverplate.com.ar', '30-12345678-9', 'Club Atlético River Plate']}
          />
          <Link href="/admin/externos/importar">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </Link>
          <ExportEntidadesButton entidades={entidades} />
          <CrearEntidadDialog />
        </div>
      </div>

      <EntidadesTable entidades={entidades} />
    </div>
  )
}
