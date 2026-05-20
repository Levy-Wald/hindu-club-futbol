import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileEdit, Send } from 'lucide-react'

export default async function HubPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: plantilla } = await service
    .from('com_plantillas')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (!plantilla) notFound()

  const { data: envios } = await service
    .from('com_envios')
    .select('id, asunto, canal, estado, created_at')
    .eq('plantilla_id', id)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Link href="/admin/comunicaciones/plantillas">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a plantillas
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{plantilla.nombre}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{plantilla.canal ?? 'email'}</Badge>
            {plantilla.tipo && <Badge variant="secondary">{plantilla.tipo}</Badge>}
          </div>
        </div>
        <Link href={`/admin/comunicaciones/plantillas/${id}/editar`}>
          <Button>
            <FileEdit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Detalle</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="font-medium">{plantilla.nombre}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Canal</dt>
            <dd className="font-medium">{plantilla.canal ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Asunto</dt>
            <dd className="font-medium">{plantilla.asunto ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Creada</dt>
            <dd className="font-medium">{new Date(plantilla.created_at).toLocaleDateString('es-AR')}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Envios relacionados</h2>
        {(!envios || envios.length === 0) ? (
          <p className="text-sm text-muted-foreground">No hay envios con esta plantilla.</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {envios.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <div>
                  <span className="text-sm font-medium">{e.asunto ?? 'Sin asunto'}</span>
                  <div className="text-xs text-muted-foreground">
                    {e.canal} · {new Date(e.created_at).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <Badge variant="outline">{e.estado}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
