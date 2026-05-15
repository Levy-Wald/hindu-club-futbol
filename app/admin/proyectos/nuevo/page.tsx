import { createClient } from '@/lib/supabase/server'
import { ProyectoForm } from '@/modules/proyectos/ui/proyecto-form'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function NuevoProyectoPage() {
  const supabase = await createClient()

  const [{ data: personas }, { data: entidades }] = await Promise.all([
    supabase
      .from('personas')
      .select('id, nombre, apellido')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('apellido')
      .limit(200),
    supabase
      .from('entidades')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre'),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Nuevo proyecto</h1>
      <ProyectoForm
        personas={(personas ?? []) as { id: string; nombre: string; apellido: string }[]}
        entidades={(entidades ?? []) as { id: string; nombre: string }[]}
      />
    </div>
  )
}
