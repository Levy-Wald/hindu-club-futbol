import { createClient } from '@/lib/supabase/server'
import { BrandingForm } from './_components/branding-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function BrandingPage() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('tenant_config_publica')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/configuracion?tab=branding">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Branding Studio</h1>
          <p className="text-sm text-muted-foreground">
            Identidad visual, contenido publico y configuracion de la pagina
          </p>
        </div>
      </div>
      <BrandingForm config={config} />
    </div>
  )
}
