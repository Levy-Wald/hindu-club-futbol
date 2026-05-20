import { createClient } from '@/lib/supabase/server'
import { MiDiaGrid } from './_components/mi-dia-grid'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: persona } = await supabase
    .from('personas')
    .select('nombre, apellido')
    .eq('user_id', user?.id ?? '')
    .is('deleted_at', null)
    .maybeSingle()

  const nombre = persona
    ? `${persona.nombre} ${persona.apellido}`
    : user?.email?.split('@')[0] ?? 'usuario'

  return <MiDiaGrid nombre={nombre} />
}
