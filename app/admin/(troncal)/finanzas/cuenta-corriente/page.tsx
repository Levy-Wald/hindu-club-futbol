import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { CuentaCorrienteClient } from './_components/cuenta-corriente-client'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function CuentaCorrientePage() {
  const supabase = await createClient()

  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .order('nombre')
    .limit(2000)

  // Fetch cajas for movimientos display
  const { data: cajas } = await supabase
    .from('cajas')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Cuenta Corriente</h1>
          <p className="text-sm text-muted-foreground">Resumen financiero por persona</p>
        </div>
      </div>

      <CuentaCorrienteClient
        personas={personas ?? []}
        cajasMap={Object.fromEntries((cajas ?? []).map(c => [c.id, c.nombre]))}
      />
    </div>
  )
}
