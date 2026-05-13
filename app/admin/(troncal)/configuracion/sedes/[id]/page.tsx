import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { listarTiposEspacio } from '@/modules/espacios/lib/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin } from 'lucide-react'
import { CrearEspacioDialog } from '@/modules/espacios/ui/crear-espacio-dialog'
import { SedeFormDialog } from '../_components/sede-form-dialog'

export default async function SedeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: sede } = await service
    .from('sedes')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()

  if (!sede) notFound()

  const [espaciosResult, tiposEspacio] = await Promise.all([
    service
      .from('espacios')
      .select('id, nombre, tipo_slug, capacidad_personas, activo')
      .eq('sede_id', id)
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre'),
    listarTiposEspacio(),
  ])

  const espacios = espaciosResult.data

  const direccion = sede.direccion as Record<string, string> | null
  const dirStr = direccion?.calle
    ? `${direccion.calle} ${direccion.numero ?? ''}, ${direccion.ciudad ?? ''}`
    : 'Sin direccion'

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/configuracion/sedes">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a sedes
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              {sede.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">{dirStr}</p>
          </div>
          <SedeFormDialog
            mode="edit"
            sede={{
              id: sede.id,
              nombre: sede.nombre,
              slug: sede.slug,
              direccion: direccion,
            }}
            triggerRender={<Button variant="outline" />}
            triggerLabel="Editar"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Espacios</h2>
          <CrearEspacioDialog
            sedes={[{ id: sede.id, nombre: sede.nombre }]}
            tiposEspacio={tiposEspacio}
            sedeIdPreseleccionada={sede.id}
            label="Nuevo espacio en esta sede"
          />
        </div>

        {(!espacios || espacios.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p>No hay espacios en esta sede.</p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {espacios.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <div>
                  <span className="font-medium text-sm">{e.nombre}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{e.tipo_slug.replace(/_/g, ' ')}</span>
                    {e.capacidad_personas && <span>· {e.capacidad_personas} personas</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!e.activo && <Badge variant="secondary">Inactivo</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
