import { createClient } from '@/lib/supabase/server'
import { BrandingForm } from './_components/branding-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

export default async function BrandingPage() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('tenant_config_publica')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single()

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
