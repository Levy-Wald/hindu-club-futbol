import { notFound } from 'next/navigation'
import { getCatalogoDef } from '@/lib/catalogos/registry'
import { fetchCatalogoData } from '../_actions'
import { CatalogoEditor } from './_components/catalogo-editor'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CatalogoDetallePage({ params }: PageProps) {
  const { slug } = await params
  const def = getCatalogoDef(slug)
  if (!def) notFound()

  const result = await fetchCatalogoData(slug)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{def.label}</h1>
        <p className="text-sm text-muted-foreground">{def.description}</p>
      </div>
      <CatalogoEditor
        catalogoSlug={slug}
        def={def}
        initialData={result.data as unknown as Record<string, unknown>[]}
      />
    </div>
  )
}
