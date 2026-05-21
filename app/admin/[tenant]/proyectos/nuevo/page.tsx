import { createClient } from '@/lib/supabase/server'
import { ProyectoForm } from '@/modules/proyectos/ui/proyecto-form'
import { TENANT_ID } from '@/lib/tenant'


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
    <ProyectoForm
      personas={(personas ?? []) as { id: string; nombre: string; apellido: string }[]}
      entidades={(entidades ?? []) as { id: string; nombre: string }[]}
    />
  )
}
