import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Calendar, User, IdCard, ArrowRight, AlertCircle } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchSocioResumen } from './_lib/queries'

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

      {/* Accesos rápidos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Accesos rápidos</p>
        {[
          { href: `${base}/cuenta`, label: 'Mi cuenta y cuotas', icon: Wallet },
          { href: `${base}/agenda`, label: 'Mi agenda de eventos', icon: Calendar },
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
