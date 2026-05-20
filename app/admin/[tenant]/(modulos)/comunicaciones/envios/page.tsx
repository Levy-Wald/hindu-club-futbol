import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { EnviosClient } from '@/modules/comunicaciones/ui/components/envios-client'

export default async function EnviosPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('com_envios')
    .select(`
      id, canal, estado, error_mensaje, created_at,
      persona:personas(id, nombre, apellido, email_principal)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(100)

  const enviosRaw = (data ?? []) as unknown as Array<{
    id: string
    canal: string
    estado: string
    error_mensaje: string | null
    created_at: string
    persona: { id: string; nombre: string; apellido: string; email_principal: string | null } | null
  }>

  const envios = enviosRaw.map((e) => ({
    id: e.id,
    canal: e.canal,
    estado: e.estado,
    error_detalle: e.error_mensaje,
    created_at: e.created_at,
    destinatario: e.persona
      ? { id: e.persona.id, nombre: e.persona.nombre, apellido: e.persona.apellido, email: e.persona.email_principal }
      : null,
    plantilla: null,
  }))

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
