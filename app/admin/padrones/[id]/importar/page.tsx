import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ImportWizard } from './_components/import-wizard'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ImportarPadronPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: padron, error } = await supabase
    .from('padrones')
    .select('id, nombre, slug')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error || !padron) notFound()

  return (
    <div className="container max-w-4xl py-6">
      <ImportWizard padronId={padron.id} padronNombre={padron.nombre} />
    </div>
  )
}
