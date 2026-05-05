import { Suspense } from 'react'
import Link from 'next/link'
import { fetchEquipos, fetchCategoriasEquipo } from './_lib/queries'
import { EquiposTable } from './_components/equipos-table'
import { CrearEquipoDialog } from './_components/crear-equipo-dialog'
import { ExportEquiposButton } from './_components/export-equipos-button'
import { EquiposSearch } from './_components/equipos-search'
import { EquiposFilters } from './_components/equipos-filters'
import { VistasPanel } from '@/components/ui/vistas-panel'
import { EQUIPOS_MODULES, EQUIPOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function EquiposPage({ searchParams }: Props) {
  const sp = await searchParams
  const search = sp.q
  const disciplina = sp.disciplina
  const activo = sp.activo

  const [equipos, categorias] = await Promise.all([
    fetchEquipos({ search, disciplina, activo }),
    fetchCategoriasEquipo(),
  ])

  const disciplinas = [...new Set(categorias.map((c) => c.disciplina_slug))].sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Equipos</h1>
        <div className="flex items-center gap-2">
          <VistasPanel modulo="equipos" modules={EQUIPOS_MODULES} defaultColumns={EQUIPOS_DEFAULT_COLUMNS} storageKey="equipos-columns" />
          <DownloadTemplateButton
            headers={['nombre', 'disciplina_slug', 'modalidad', 'categoria', 'nivel_competencia', 'color_principal']}
            filename="modelo_equipos.csv"
            sampleRow={['Sub-15 Masculino', 'futbol', 'M', 'sub_15', 'competitivo', '#003366']}
          />
          <Link href="/admin/equipos/importar">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </Link>
          <ExportEquiposButton equipos={equipos} />
          <CrearEquipoDialog categorias={categorias} disciplinas={disciplinas} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Suspense>
          <EquiposSearch />
        </Suspense>
        <Suspense>
          <EquiposFilters disciplinas={disciplinas} />
        </Suspense>
      </div>

      <EquiposTable equipos={equipos} />
    </div>
  )
}
