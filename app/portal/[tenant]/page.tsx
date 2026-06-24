import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Calendar, User, IdCard, ArrowRight, AlertCircle, ShieldHalf, LandPlot, Bell, Building2, Swords, Dumbbell, ChevronRight } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchSocioResumen } from './_lib/queries'
import { fetchMisEquipos, fetchEventosEquipo } from './equipo/_lib/queries'

const TIPO_ICON: Record<string, typeof Swords> = { partido: Swords, amistoso: Swords, entrenamiento: Dumbbell }
const TIPO_LABEL: Record<string, string> = { partido: 'Partido', amistoso: 'Amistoso', entrenamiento: 'Entrenamiento' }

function formatARS(amount: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount)
}

interface PageProps {
  params: Promise<{ tenant: string }>
}

export default async function PortalDashboard({ params }: PageProps) {
  const { tenant } = await params
  const personaId = await getCurrentPersonaId()
  const resumen = personaId ? await fetchSocioResumen(personaId) : null
  const base = `/portal/${tenant}`

  // Calendario global: próximos eventos de todos mis equipos/disciplinas
  const misEquipos = personaId ? await fetchMisEquipos(personaId) : []
  const equiposById = new Map(misEquipos.map((e) => [e.equipo_id, e]))
  const eventos = personaId && misEquipos.length > 0
    ? (await fetchEventosEquipo(personaId, misEquipos.map((e) => e.equipo_id))).slice(0, 5)
    : []

  return (
    <div className="space-y-4">
      {/* Membresía */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IdCard className="h-4 w-4" />
              <span className="text-sm">{resumen?.membresia?.padron_nombre ?? 'Membresía'}</span>
            </div>
            {resumen?.membresia ? (
              <Badge variant={resumen.membresia.activo ? 'default' : 'secondary'}>
                {resumen.membresia.activo ? 'Activa' : 'Inactiva'}
              </Badge>
            ) : (
              <Badge variant="secondary">Sin membresía</Badge>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {resumen?.membresia?.numero_socio ? `N° ${resumen.membresia.numero_socio}` : '—'}
          </p>
          {resumen?.membresia?.fecha_alta && (
            <p className="text-xs text-muted-foreground">
              Socio desde {new Date(resumen.membresia.fecha_alta).toLocaleDateString('es-AR')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Saldo + próxima cuota */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo de cuenta</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatARS(resumen?.saldo ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Próxima cuota</p>
            {resumen?.proximaCuota ? (
              <>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatARS(resumen.proximaCuota.monto, resumen.proximaCuota.moneda)}
                </p>
                {resumen.proximaCuota.fecha_vencimiento && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Vence {new Date(resumen.proximaCuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Sin cuotas pendientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendario global: próximos eventos de todos mis equipos */}
      {eventos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-muted-foreground">Próximos eventos</p>
            <Link href={`${base}/agenda`} className="text-xs text-primary hover:underline">Ver agenda</Link>
          </div>
          {eventos.map((e) => {
            const Icon = TIPO_ICON[e.tipo] ?? Calendar
            const eq = equiposById.get(e.equipo_id)
            const d = e.fecha_inicio ? new Date(e.fecha_inicio + 'T00:00:00') : null
            return (
              <Link key={e.id} href={`${base}/agenda/${e.id}`}>
                <Card className="hover:bg-muted/40 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 text-[10px] font-semibold leading-none">
                      <span>{d ? d.getDate() : '--'}</span>
                      <span className="uppercase">{d ? d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '') : ''}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {TIPO_LABEL[e.tipo] ?? e.tipo}{e.titulo ? ` · ${e.titulo}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {eq?.nombre ?? ''}{e.hora_inicio ? ` · ${e.hora_inicio.slice(0, 5)}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Accesos rápidos</p>
        {[
          { href: `${base}/cuenta`, label: 'Mi cuenta y cuotas', icon: Wallet },
          { href: `${base}/equipo`, label: 'Mi equipo y partidos', icon: ShieldHalf },
          { href: `${base}/reservas`, label: 'Reservar un espacio', icon: LandPlot },
          { href: `${base}/agenda`, label: 'Mi agenda de eventos', icon: Calendar },
          { href: `${base}/notificaciones`, label: 'Mensajes y avisos', icon: Bell },
          { href: `${base}/club`, label: 'El club y sus sedes', icon: Building2 },
          { href: `${base}/perfil`, label: 'Mi perfil y familia', icon: User },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
