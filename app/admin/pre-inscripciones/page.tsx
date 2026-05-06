import { fetchPreInscripciones, fetchPreInscripcionesStats } from './_lib/queries'
import { PreInscripcionesClient } from './_components/pre-inscripciones-client'

interface PageProps {
  searchParams: Promise<{ filtro?: string }>
}

export default async function PreInscripcionesPage({ searchParams }: PageProps) {
  const { filtro } = await searchParams
  const [inscripciones, stats] = await Promise.all([
    fetchPreInscripciones(filtro),
    fetchPreInscripcionesStats(),
  ])

  return <PreInscripcionesClient inscripciones={inscripciones} stats={stats} filtroActual={filtro || 'todas'} />
}
