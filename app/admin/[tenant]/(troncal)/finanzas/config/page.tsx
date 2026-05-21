import { createClient } from '@/lib/supabase/server'
import { ConfigFinancieraForm } from './_components/config-form'
import { TENANT_ID } from '@/lib/tenant'


export default async function ConfigFinancieraPage() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('config_financiera')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  return <ConfigFinancieraForm config={config} />
}
