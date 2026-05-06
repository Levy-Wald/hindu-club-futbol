import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle2, AlertTriangle, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

const estadoBadgeStyles: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pagada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  parcial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  anulada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  vencida: 'Vencida',
  pagada: 'Pagada',
  parcial: 'Parcial',
  anulada: 'Anulada',
}

const convenioEstadoLabels: Record<string, string> = {
  vigente: 'Vigente',
  completado: 'Completado',
  incumplido: 'Incumplido',
  anulado: 'Anulado',
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto)
}

function formatFecha(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function MiCuentaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .eq('user_id', user.id)
    .single()

  if (!persona) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold">Mi cuenta</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontro tu perfil de persona asociado a tu usuario.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch financial data in parallel
  const [cuentaCorrienteRes, cuotasRes, movimientosRes, conveniosRes] =
    await Promise.all([
      supabase
        .from('cuentas_corrientes')
        .select('saldo, saldo_usd, ultimo_movimiento_at, tipo')
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('tipo', 'socio')
        .maybeSingle(),
      supabase
        .from('cuotas_emitidas')
        .select(
          'id, periodo, monto_original, monto_final, estado, fecha_emision, fecha_vencimiento, moneda'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .in('estado', ['pendiente', 'vencida'])
        .order('fecha_vencimiento', { ascending: true }),
      supabase
        .from('movimientos_caja')
        .select(
          'id, numero, tipo, monto_neto, moneda, fecha, descripcion, categoria_id, anulado'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('anulado', false)
        .order('fecha', { ascending: false })
        .limit(20),
      supabase
        .from('convenios_pago')
        .select(
          'id, deuda_original, cantidad_cuotas, monto_cuota, cuotas_pagadas, estado, fecha_inicio, proximo_vencimiento'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('estado', 'vigente'),
    ])

  const cuentaCorriente = cuentaCorrienteRes.data
  const cuotasPendientes = cuotasRes.data ?? []
  const movimientos = movimientosRes.data ?? []
  const convenios = conveniosRes.data ?? []

  const saldo = cuentaCorriente?.saldo ?? 0
  const alDia = cuotasPendientes.filter((c) => c.estado === 'vencida').length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground">
            {persona.nombre} {persona.apellido}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Saldo de cuenta corriente</p>
            <p
              className={cn(
                'text-3xl font-bold',
                saldo > 0
                  ? 'text-green-600 dark:text-green-400'
                  : saldo < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground'
              )}
            >
              {formatMonto(saldo)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {saldo > 0
                ? 'Saldo a favor'
                : saldo < 0
                  ? 'Saldo deudor'
                  : 'Sin saldo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {alDia ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Al dia
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Con deuda
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cuotas pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cuotas pendientes
            {cuotasPendientes.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {cuotasPendientes.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cuotasPendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tenes cuotas pendientes. Todo en orden.
            </p>
          ) : (
            <div className="space-y-2">
              {cuotasPendientes.map((cuota) => (
                <div
                  key={cuota.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      Periodo {cuota.periodo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {formatFecha(cuota.fecha_vencimiento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        estadoBadgeStyles[cuota.estado] ?? 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {estadoLabels[cuota.estado] ?? cuota.estado}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatMonto(cuota.monto_final)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convenios de pago */}
      {convenios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Convenios de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {convenios.map((convenio) => (
                <div
                  key={convenio.id}
                  className="border rounded-lg px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Convenio desde {formatFecha(convenio.fecha_inicio)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {convenioEstadoLabels[convenio.estado] ?? convenio.estado}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Deuda original</p>
                      <p>{formatMonto(convenio.deuda_original)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Cuota</p>
                      <p>
                        {formatMonto(convenio.monto_cuota)} ({convenio.cuotas_pagadas}/
                        {convenio.cantidad_cuotas})
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Pagadas</p>
                      <p>
                        {convenio.cuotas_pagadas} de {convenio.cantidad_cuotas}
                      </p>
                    </div>
                    {convenio.proximo_vencimiento && (
                      <div>
                        <p className="font-medium text-foreground">Proximo vencimiento</p>
                        <p>{formatFecha(convenio.proximo_vencimiento)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay movimientos registrados en tu cuenta.
            </p>
          ) : (
            <div className="space-y-1">
              {movimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between border-b last:border-b-0 py-2.5 px-1"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {mov.numero && (
                        <span className="text-xs font-mono text-muted-foreground">
                          #{mov.numero}
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          mov.tipo === 'ingreso'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {mov.descripcion ?? 'Sin descripcion'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        mov.tipo === 'ingreso'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {mov.tipo === 'ingreso' ? '+' : '-'}
                      {formatMonto(Math.abs(mov.monto_neto))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(mov.fecha)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
