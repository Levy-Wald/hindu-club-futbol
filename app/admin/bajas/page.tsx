import { Suspense } from 'react'
import { fetchBajas, fetchCatalogoMotivosBaja } from './_lib/queries'
import { BajasTable } from './_components/bajas-table'
import { BajasSearchBar } from './_components/bajas-search-bar'
import { BajasFilters } from './_components/bajas-filters'
import { BajasExportButton } from './_components/bajas-export-button'
import { BajasVistas } from './_components/bajas-vistas'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function BajasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  const pageSize = 50
  const search = params.q ?? ''
  const sortBy = params.sort ?? 'fecha_baja'
  const sortDir = (params.dir ?? 'desc') as 'asc' | 'desc'
  const motivos = params.motivos?.split(',').filter(Boolean) ?? []
  const fechaDesde = params.fecha_desde
  const fechaHasta = params.fecha_hasta

  const [{ data: bajas, total }, catalogoMotivos] = await Promise.all([
    fetchBajas({ search, page, pageSize, sortBy, sortDir, motivos, fechaDesde, fechaHasta }),
    fetchCatalogoMotivosBaja(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Bajas</h1>
        <div className="flex items-center gap-2">
          <BajasVistas />
          <DownloadTemplateButton
            headers={['apellido', 'nombre', 'numero_documento', 'email_principal', 'motivo_baja', 'fecha_baja', 'detalle']}
            filename="modelo_bajas.csv"
            sampleRow={['Perez', 'Juan', '12345678', 'juan@email.com', 'renuncia_voluntaria', '2026-01-15', 'Se mudó']}
          />
          <BajasExportButton />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Suspense>
          <BajasSearchBar />
        </Suspense>
        <Suspense>
          <BajasFilters
            motivos={catalogoMotivos.map((m) => ({ value: m.slug, label: m.nombre }))}
          />
        </Suspense>
      </div>

      <BajasTable
        bajas={bajas}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}
