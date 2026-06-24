import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchMiCuentaResumen } from './_lib/queries'
import { PagarCuotaButton } from './_components/pagar-cuota-button'
import { DescargarResumen } from './_components/descargar-resumen'

function formatMoneda(amount: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount)
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pagada: 'default',
  pendiente: 'outline',
  emitida: 'outline',
  vencida: 'destructive',
  anulada: 'secondary',
}

const PENDIENTES = new Set(['pendiente', 'emitida', 'vencida'])

export default async function PortalCuentaPage() {
  const personaId = await getCurrentPersonaId()
  const resumen = personaId
    ? await fetchMiCuentaResumen(personaId)
    : { saldo: 0, saldo_usd: 0, cuotas: [], movimientos: [] }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Mi cuenta</h1>
        <DescargarResumen cuotas={resumen.cuotas} movimientos={resumen.movimientos} />
      </div>

      {/* Saldo */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Saldo de cuenta corriente</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoneda(resumen.saldo)}</p>
          {resumen.saldo_usd !== 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">{formatMoneda(resumen.saldo_usd, 'USD')}</p>
          )}
        </CardContent>
      </Card>

      {/* Cuotas */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Cuotas</p>
        {resumen.cuotas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">No tenés cuotas registradas.</CardContent>
          </Card>
        ) : (
          resumen.cuotas.map((c) => {
            const pendiente = PENDIENTES.has(c.estado)
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{c.periodo ?? 'Cuota'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={ESTADO_VARIANT[c.estado] ?? 'secondary'}>{c.estado}</Badge>
                      {c.fecha_vencimiento && (
                        <span className="text-xs text-muted-foreground">
                          vence {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">{formatMoneda(c.monto_final, c.moneda)}</p>
                    {pendiente && (
                      <div className="mt-1">
                        <PagarCuotaButton
                          cuotaId={c.id}
                          periodo={c.periodo}
                          monto={c.monto_final}
                          moneda={c.moneda}
                          montoLabel={formatMoneda(c.monto_final, c.moneda)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Historial de movimientos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Historial de pagos y movimientos</p>
        {resumen.movimientos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Sin movimientos registrados.</CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {resumen.movimientos.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.descripcion ?? m.tipo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.fecha).toLocaleDateString('es-AR')}{m.numero ? ` · ${m.numero}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums shrink-0">{formatMoneda(m.monto_neto, m.moneda)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
