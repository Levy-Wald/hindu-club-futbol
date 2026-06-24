import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, ChevronRight } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { obtenerEventosPersonales, obtenerInvitacionesPendientes } from '@/modules/eventos/lib/queries'
import { PanelInvitacionesPendientes } from '@/modules/eventos/ui/panel-invitaciones-pendientes'

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface PageProps {
  params: Promise<{ tenant: string }>
}

export default async function PortalAgendaPage({ params }: PageProps) {
  const { tenant } = await params
  const personaId = await getCurrentPersonaId()

  if (!personaId) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">Mi agenda</h1>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No encontramos tu perfil asociado a este usuario.
          </CardContent>
        </Card>
      </div>
    )
  }

  const hoy = new Date()
  const hasta = new Date(hoy)
  hasta.setDate(hasta.getDate() + 60)

  const [eventos, invitaciones] = await Promise.all([
    obtenerEventosPersonales(personaId, tenant, ymd(hoy), ymd(hasta)),
    obtenerInvitacionesPendientes(personaId, tenant),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi agenda</h1>

      {/* Invitaciones pendientes (aceptar/rechazar) — componente reutilizado de F1.4 */}
      <PanelInvitacionesPendientes invitaciones={invitaciones} />

      {/* Próximos eventos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Próximos eventos</p>
        {eventos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
              No tenés eventos próximos.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {eventos.map((e) => (
              <Link key={e.id} href={`/portal/${tenant}/agenda/${e.id}`}>
              <Card className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-start gap-3">
                  <div
                    className="mt-1 h-9 w-9 rounded-md flex flex-col items-center justify-center shrink-0 text-[10px] font-semibold leading-none"
                    style={{ backgroundColor: (e.color as string | null) ?? 'var(--muted)', color: '#fff' }}
                  >
                    <span>{e.fecha_inicio ? new Date(e.fecha_inicio + 'T00:00:00').getDate() : '--'}</span>
                    <span className="uppercase">
                      {e.fecha_inicio
                        ? new Date(e.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
                        : ''}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{e.titulo ?? '(sin título)'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                      {e.hora_inicio && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {e.hora_inicio.slice(0, 5)}
                          {e.hora_fin ? `–${e.hora_fin.slice(0, 5)}` : ''}
                        </span>
                      )}
                      {e.equipo_nombre && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {e.equipo_nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  {e.tipo_evento_slug && (
                    <Badge variant="outline" className="capitalize shrink-0">
                      {String(e.tipo_evento_slug).replace(/_/g, ' ')}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
