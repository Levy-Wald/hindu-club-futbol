import { createClient } from '@/lib/supabase/server'
import { EnviosClient } from '@/modules/comunicaciones/ui/components/envios-client'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function EnviosPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('com_envios')
    .select(`
      id, canal, estado, error_detalle, created_at,
      destinatario:personas!destinatario_id(id, nombre, apellido, email),
      plantilla:com_plantillas!plantilla_id(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(100)

  const envios = (data ?? []) as unknown as Array<{
    id: string
    canal: string
    estado: string
    error_detalle: string | null
    created_at: string
    destinatario: { id: string; nombre: string; apellido: string; email: string | null } | null
    plantilla: { id: string; nombre: string } | null
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Historial de envios</h1>
        <p className="text-sm text-muted-foreground">
          Registro de todas las comunicaciones enviadas
        </p>
      </div>

      <EnviosClient envios={envios} />
    </div>
  )
}
