import { createClient } from '@/lib/supabase/server'
import { LibroMayorClient } from './_components/libro-mayor-client'
import { TENANT_ID } from '@/lib/tenant'


export default async function LibroMayorPage() {
  const supabase = await createClient()

  const { data: cuentas } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .eq('es_imputable', true)
    .order('codigo')

  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .limit(500)

  return (
    <LibroMayorClient
      cuentas={cuentas ?? []}
      personas={personas ?? []}
    />
  )
}
