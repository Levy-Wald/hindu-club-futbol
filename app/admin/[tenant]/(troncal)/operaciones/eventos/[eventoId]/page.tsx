import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, ClipboardList, Swords, Target } from 'lucide-react'

const TIPO_LABELS: Record<string, string> = {
  entrenamiento: 'Entrenamiento',
  partido: 'Partido',
  amistoso: 'Amistoso',
  reserva: 'Reserva',
  reunion: 'Reunion',
  otro: 'Otro',
}

export default async function HubEventoPage({
  params,
}: {
  params: Promise<{ eventoId: string }>
}) {
  const { eventoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: evento } = await service
    .from('eventos')
    .select('*')
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (!evento) notFound()

  const tipo = evento.tipo_evento_slug ?? 'otro'

  // Fetch related data
  const [sedeResult, equipoResult, espacioResult] = await Promise.all([
    evento.sede_id
      ? service.from('sedes').select('nombre').eq('id', evento.sede_id).maybeSingle()
      : { data: null },
    evento.equipo_id
      ? service.from('equipos').select('nombre').eq('id', evento.equipo_id).maybeSingle()
      : { data: null },
    evento.espacio_id
      ? service.from('espacios').select('nombre').eq('id', evento.espacio_id).maybeSingle()
      : evento.cancha_id
        ? service.from('canchas').select('nombre').eq('id', evento.cancha_id).maybeSingle()
        : { data: null },
  ])

  const tabs = [
    { label: 'Asistencia', href: `/admin/operaciones/eventos/${eventoId}/asistencia`, icon: ClipboardList, show: true },
    { label: 'Plan', href: `/admin/operaciones/eventos/${eventoId}/plan`, icon: Calendar, show: tipo === 'entrenamiento' },
    { label: 'Tactica', href: `/admin/operaciones/eventos/${eventoId}/tactica`, icon: Target, show: ['entrenamiento', 'partido', 'amistoso'].includes(tipo) },
    { label: 'Amistoso', href: `/admin/operaciones/eventos/${eventoId}/amistoso`, icon: Swords, show: tipo === 'amistoso' },
  ].filter(t => t.show)

  return (
    <div className="container mx-auto p-4 max-w-5xl" data-testid="hub-evento">
      <Link href="/admin/planificadores/semanal">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al calendario
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{evento.titulo}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge>{TIPO_LABELS[tipo] ?? tipo}</Badge>
          {equipoResult?.data && <Badge variant="secondary">{equipoResult.data.nombre}</Badge>}
          {evento.estado && <Badge variant="outline">{evento.estado}</Badge>}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {evento.fecha && <span>{evento.fecha}</span>}
          {evento.hora_inicio && <span>{evento.hora_inicio} - {evento.hora_fin ?? '?'}</span>}
          {sedeResult?.data && <span>{sedeResult.data.nombre}</span>}
          {espacioResult?.data && <span>· {espacioResult.data.nombre}</span>}
        </div>
      </div>

      {/* Info tab (default) */}
      <div className="border rounded-lg p-6 mb-6" data-testid="tab-evento-info">
        <h2 className="text-lg font-semibold mb-4">Informacion del evento</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Tipo</dt>
            <dd className="font-medium">{TIPO_LABELS[tipo] ?? tipo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fecha</dt>
            <dd className="font-medium">{evento.fecha ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Horario</dt>
            <dd className="font-medium">{evento.hora_inicio ?? '-'} - {evento.hora_fin ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sede</dt>
            <dd className="font-medium">{sedeResult?.data?.nombre ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Espacio</dt>
            <dd className="font-medium">{espacioResult?.data?.nombre ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Equipo</dt>
            <dd className="font-medium">{equipoResult?.data?.nombre ?? '-'}</dd>
          </div>
          {evento.descripcion && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Descripcion</dt>
              <dd className="font-medium">{evento.descripcion}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2" data-testid="tab-evento-ct">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <Button variant="outline" size="sm">
              <tab.icon className="h-4 w-4 mr-1.5" />
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
