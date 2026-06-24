import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchCanchas, fetchMisReservas } from './_lib/queries'
import { SolicitarReserva } from './_components/solicitar-reserva'

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pendiente: 'outline',
  confirmada: 'default',
  pagada: 'default',
  cancelada: 'destructive',
  rechazada: 'destructive',
}

function ars(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default async function PortalReservasPage() {
  const personaId = await getCurrentPersonaId()
  const [canchas, misReservas] = await Promise.all([
    fetchCanchas(),
    personaId ? fetchMisReservas(personaId) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Reservar un espacio</h1>
        <p className="text-sm text-muted-foreground">Elegí espacio, día y horario. El club confirma tu reserva.</p>
      </div>

      <SolicitarReserva canchas={canchas} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Mis reservas</p>
        {misReservas.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Todavía no tenés reservas.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {misReservas.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.cancha_nombre ?? 'Espacio'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.fecha ? new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                      {r.hora_inicio ? ` · ${r.hora_inicio.slice(0, 5)}` : ''}{r.hora_fin ? `–${r.hora_fin.slice(0, 5)}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={ESTADO_VARIANT[r.estado] ?? 'secondary'}>{r.estado}</Badge>
                    {r.tarifa_total != null && r.tarifa_total > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{ars(r.tarifa_total)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
