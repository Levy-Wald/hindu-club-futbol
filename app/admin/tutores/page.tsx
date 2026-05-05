import { Suspense } from 'react'
import { fetchTutores } from './_lib/queries'
import { TutoresTable } from './_components/tutores-table'
import { TutoresSearchBar } from './_components/tutores-search-bar'
import { TutoresFilters } from './_components/tutores-filters'
import { TutoresVistas } from './_components/tutores-vistas'
import { TutoresExportButton } from './_components/tutores-export-button'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function TutoresPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  const pageSize = 50
  const search = params.q ?? ''
  const sortBy = params.sort ?? 'apellido'
  const sortDir = (params.dir ?? 'asc') as 'asc' | 'desc'
  const conMenor = params.conMenor === '1'
  const sinMenor = params.sinMenor === '1'

  const { data: tutores, total } = await fetchTutores({
    search,
    page,
    pageSize,
    sortBy,
    sortDir,
    conMenor,
    sinMenor,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Tutores / Padres</h1>
        <div className="flex items-center gap-2">
          <TutoresVistas />
          <DownloadTemplateButton
            headers={['nombre', 'apellido', 'numero_documento', 'email_principal', 'telefono_principal']}
            filename="modelo_tutores.csv"
            sampleRow={['María', 'González', '23456789', 'maria@email.com', '1155009876']}
          />
          <TutoresExportButton />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Suspense>
          <TutoresSearchBar />
        </Suspense>
        <Suspense>
          <TutoresFilters />
        </Suspense>
      </div>

      <TutoresTable
        tutores={tutores}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}
