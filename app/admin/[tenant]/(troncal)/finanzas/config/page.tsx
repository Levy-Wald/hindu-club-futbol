import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { ConfigFinancieraForm } from './_components/config-form'
import { TENANT_ID } from '@/lib/tenant'


export default async function ConfigFinancieraPage() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('config_financiera')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Configuracion Financiera</h1>
          <p className="text-sm text-muted-foreground">Parametros generales del modulo de finanzas</p>
        </div>
      </div>

      <ConfigFinancieraForm config={config} />
    </div>
  )
}
