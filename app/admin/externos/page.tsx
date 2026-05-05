import { Suspense } from 'react'
import Link from 'next/link'
import { fetchEntidades, fetchEntidadesParent } from './_lib/queries'
import { EntidadesTable } from './_components/entidades-table'
import { CrearEntidadDialog } from './_components/crear-entidad-dialog'
import { ExportEntidadesButton } from './_components/export-entidades-button'
import { ExternosSearch } from './_components/externos-search'
import { ExternosFilters } from './_components/externos-filters'
import { VistasPanel } from '@/components/ui/vistas-panel'
import { EXTERNOS_MODULES, EXTERNOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ExternosPage({ searchParams }: Props) {
  const sp = await searchParams
  const search = sp.q
  const tipo = sp.tipo
  const activo = sp.activo

  const [entidades, entidadesParent] = await Promise.all([
    fetchEntidades({ search, tipo, activo }),
    fetchEntidadesParent(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Entidades</h1>
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
          <CrearEntidadDialog entidadesParent={entidadesParent} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Suspense>
          <ExternosSearch />
        </Suspense>
        <Suspense>
          <ExternosFilters />
        </Suspense>
      </div>

      <EntidadesTable entidades={entidades} />
    </div>
  )
}
