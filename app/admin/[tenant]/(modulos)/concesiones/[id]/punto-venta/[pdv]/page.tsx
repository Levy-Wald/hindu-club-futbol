import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Store, ShoppingCart } from 'lucide-react'

export default async function PuntoVentaDetallePage({
  params,
}: {
  params: Promise<{ id: string; pdv: string }>
}) {
  const { id, pdv } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: puntoVenta } = await service
    .from('concesion_puntos_venta')
    .select('*')
    .eq('id', pdv)
    .eq('concesionario_id', id)
    .maybeSingle()

  if (!puntoVenta) notFound()

  const { data: concesionario } = await service
    .from('concesionarios')
    .select('nombre_comercial')
    .eq('id', id)
    .maybeSingle()

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href={`/admin/concesiones/${id}`}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a {concesionario?.nombre_comercial ?? 'concesionario'}
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            {puntoVenta.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            Punto de venta de {concesionario?.nombre_comercial ?? 'concesionario'}
          </p>
        </div>
        <Link href={`/admin/concesiones/${id}/punto-venta/${pdv}/vender`}>
          <Button>
            <ShoppingCart className="h-4 w-4 mr-2" /> Vender
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Detalle</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="font-medium">{puntoVenta.nombre}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant={puntoVenta.activo ? 'default' : 'secondary'}>
                {puntoVenta.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
