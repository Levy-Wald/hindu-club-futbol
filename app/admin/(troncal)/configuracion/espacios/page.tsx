import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { listarEspacios, listarTiposEspacio } from '@/modules/espacios/lib/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'
import { CrearEspacioDialog } from '@/modules/espacios/ui/crear-espacio-dialog'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function EspaciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [espacios, tiposEspacio] = await Promise.all([
    listarEspacios(TENANT_ID),
    listarTiposEspacio(),
  ])

  const service = createServiceRoleClient()
  const { data: sedes } = await service
    .from('sedes')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')

  return (
    <div className="container mx-auto p-4 max-w-5xl" data-testid="pantalla-espacios">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Espacios</h1>
          <p className="text-sm text-muted-foreground">Lugares fisicos asignables a eventos y reservas</p>
        </div>
        <CrearEspacioDialog
          sedes={sedes ?? []}
          tiposEspacio={tiposEspacio}
        />
      </div>

      {espacios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay espacios configurados.</p>
          <p className="text-sm">Configura tus sedes primero, luego agrega espacios.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_80px_60px] gap-4 p-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <span>Nombre</span>
            <span>Sede</span>
            <span>Tipo</span>
            <span>Capacidad</span>
            <span></span>
          </div>
          {espacios.map((e) => (
            <div key={e.id} className="grid sm:grid-cols-[1fr_1fr_1fr_80px_60px] gap-2 sm:gap-4 p-3 border-b last:border-b-0 items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{e.nombre}</span>
                {!e.activo && <Badge variant="secondary">Inactivo</Badge>}
              </div>
              <span className="text-sm text-muted-foreground">{e.sede_nombre}</span>
              <span className="text-sm text-muted-foreground capitalize">{e.tipo_slug.replace(/_/g, ' ')}</span>
              <span className="text-sm text-muted-foreground">{e.capacidad_personas ?? '-'}</span>
              <div className="text-right">
                <Button variant="ghost" size="sm">...</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
