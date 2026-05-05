import { createClient } from '@/lib/supabase/server'

export async function fetchEntidades() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entidades')
    .select('*')
    .order('nombre')

  if (error) throw error
  return data ?? []
}
