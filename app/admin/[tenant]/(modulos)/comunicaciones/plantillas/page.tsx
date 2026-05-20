import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PlantillasClient } from '@/modules/comunicaciones/ui/components/plantillas-client'

export default async function PlantillasPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('com_plantillas')
    .select('id, nombre, slug, tipo, asunto, cuerpo, variables_disponibles, activa, created_at, updated_at')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')

  const plantillas = data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Plantillas</h1>
        <p className="text-sm text-muted-foreground">
          Gestion de plantillas de comunicacion del club
        </p>
      </div>

      <PlantillasClient plantillas={plantillas} />
    </div>
  )
}
