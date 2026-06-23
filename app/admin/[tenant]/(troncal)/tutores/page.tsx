import { Suspense } from 'react'
import { fetchTutores } from './_lib/queries'
import { TutoresTable } from './_components/tutores-table'
import { TutoresSearch } from './_components/tutores-search'

interface PageProps {
  params: Promise<{ tenant: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function TutoresPage({ params, searchParams }: PageProps) {
  const { tenant: tenantId } = await params
  const { q } = await searchParams

  const tutores = await fetchTutores(tenantId, { search: q ?? '' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Tutores</h1>
        <span className="text-sm text-muted-foreground">{tutores.length} tutor{tutores.length === 1 ? '' : 'es'}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Responsables de menores (padre / madre / tutor legal) y los menores a su cargo.
      </p>
      <Suspense>
        <TutoresSearch />
      </Suspense>
      <TutoresTable tutores={tutores} />
    </div>
  )
}
