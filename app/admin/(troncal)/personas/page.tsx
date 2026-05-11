import { Suspense } from 'react'
import Link from 'next/link'
import { fetchPersonas, fetchCatalogoAtributos } from './_lib/queries'
import { PersonasTable } from './_components/personas-table'
import { SearchBar } from './_components/search-bar'
import { PersonasFilters } from './_components/personas-filters'
import { CrearPersonaSheet } from './_components/crear-persona-sheet'
import { ImportButton } from './_components/import-button'
import { ExportButton } from './_components/export-button'
import { PersonasVistas } from './_components/personas-vistas'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function PersonasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  const pageSize = 50
  const search = params.q ?? ''
  const sortBy = params.sort ?? 'apellido'
  const sortDir = (params.dir ?? 'asc') as 'asc' | 'desc'
  const estados = params.estados?.split(',').filter(Boolean) ?? []
  const atributos = params.atributos?.split(',').filter(Boolean) ?? []
  const verEliminadas = params.eliminadas === '1'

  const [{ data: personas, total }, catalogoAtributos] = await Promise.all([
    fetchPersonas({ search, page, pageSize, sortBy, sortDir, estados, atributos, verEliminadas }),
    fetchCatalogoAtributos(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Personas</h1>
        <div className="flex items-center gap-2">
          <PersonasVistas />
          <DownloadTemplateButton
            headers={['nombre', 'apellido', 'numero_documento', 'email_principal', 'telefono_principal', 'fecha_nacimiento', 'genero', 'cuil_cuit', 'tipo_documento', 'direccion_calle', 'direccion_ciudad', 'direccion_provincia']}
            filename="modelo_personas.csv"
            sampleRow={['Juan', 'Pérez', '12345678', 'juan@email.com', '1155001234', '1990-01-15', 'M', '20-12345678-9', 'dni', 'Av. Libertador 1234', 'Buenos Aires', 'CABA']}
          />
          <ExportButton />
          <Link href="/admin/personas/importar">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </Link>
          <CrearPersonaSheet />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <PersonasFilters
            atributos={catalogoAtributos.map((a) => ({ value: a.slug, label: a.nombre }))}
          />
        </Suspense>
      </div>

      <PersonasTable
        personas={personas}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}
