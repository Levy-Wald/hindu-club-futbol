import { createClient } from '@/lib/supabase/server'
import { CobranzasClient } from './_components/cobranzas-client'
import { TENANT_ID } from '@/lib/tenant'


export default async function CobranzasPage() {
  const supabase = await createClient()

  const { data: planes } = await supabase
    .from('cuotas_planes')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  // Get available periodos
  const { data: periodos } = await supabase
    .from('cuotas_emitidas')
    .select('periodo')
    .eq('tenant_id', TENANT_ID)
    .order('periodo', { ascending: false })

  const uniquePeriodos = [...new Set((periodos ?? []).map((p) => p.periodo))].filter(Boolean)

  return (
    <CobranzasClient
      planes={planes ?? []}
      periodos={uniquePeriodos}
    />
  )
}
