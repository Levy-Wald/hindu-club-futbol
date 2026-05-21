import { notFound } from 'next/navigation'
import { fetchPadronDetalle } from '../../_lib/queries'
import { ImportWizard } from './_components/import-wizard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImportarPadronPage({ params }: PageProps) {
  const { id } = await params

  const padron = await fetchPadronDetalle(id).catch(() => null)
  if (!padron) notFound()

  return (
    <ImportWizard
      padronId={padron.id}
      padronNombre={padron.nombre}
      padronTipo={padron.tipo}
    />
  )
}
