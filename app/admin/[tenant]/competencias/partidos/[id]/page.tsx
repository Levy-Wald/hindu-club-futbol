import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { isValidTenantId } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, BarChart3, Users } from 'lucide-react'

export default async function HubPartidoPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>
}) {
  const { tenant: tenantId, id } = await params
  if (!isValidTenantId(tenantId)) redirect('/login?error=tenant-not-found')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: evento } = await service
    .from('eventos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .maybeSingle()

  if (!evento) notFound()

  const { data: detalle } = await service
    .from('partidos_detalle')
    .select('*')
    .eq('evento_id', id)
    .maybeSingle()

  const { data: equipo } = evento.equipo_id
    ? await service.from('equipos').select('nombre').eq('id', evento.equipo_id).maybeSingle()
    : { data: null }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Link href={`/admin/${tenantId}/competencias/torneos`}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a competencias
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{evento.titulo}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge>Partido</Badge>
          {equipo && <Badge variant="secondary">{equipo.nombre}</Badge>}
          {detalle?.condicion && <Badge variant="outline">{detalle.condicion}</Badge>}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {evento.fecha && <span>{evento.fecha}</span>}
          {evento.hora_inicio && <span>{evento.hora_inicio}</span>}
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informacion del partido</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Rival</dt>
            <dd className="font-medium">{detalle?.rival_texto ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Condicion</dt>
            <dd className="font-medium">{detalle?.condicion ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Resultado</dt>
            <dd className="font-medium">
              {detalle?.marcador_local != null ? `${detalle.marcador_local} - ${detalle.marcador_visitante}` : 'Pendiente'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/${tenantId}/competencias/partidos/${id}/resultado`}>
          <Button variant="outline" size="sm">
            <Trophy className="h-4 w-4 mr-1.5" /> Resultado
          </Button>
        </Link>
        <Link href={`/admin/${tenantId}/operaciones/eventos/${id}/asistencia`}>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1.5" /> Asistencia
          </Button>
        </Link>
      </div>
    </div>
  )
}
