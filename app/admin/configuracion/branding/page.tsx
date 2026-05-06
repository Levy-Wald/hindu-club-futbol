import { createClient } from '@/lib/supabase/server'
import { BrandingForm } from './_components/branding-form'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function BrandingPage() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('tenant_config_publica')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Branding y contenido publico</h1>
        <p className="text-sm text-muted-foreground mt-1">Configura la imagen publica del club y el contenido de la pagina</p>
      </div>
      <BrandingForm config={config} />
    </div>
  )
}
