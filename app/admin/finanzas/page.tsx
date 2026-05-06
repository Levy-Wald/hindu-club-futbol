import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  Landmark,
  CreditCard,
  ArrowRightLeft,
  Plus,
  Minus,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

function formatMoney(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}

const TIPO_ICONS: Record<string, typeof TrendingUp> = {
  ingreso: TrendingUp,
  egreso: TrendingDown,
  transferencia: ArrowRightLeft,
}

const TIPO_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ingreso: 'default',
  egreso: 'destructive',
  transferencia: 'secondary',
}

const CAJA_TIPO_ICONS: Record<string, typeof Wallet> = {
  efectivo: Wallet,
  banco: Landmark,
  digital: CreditCard,
}

export default async function FinanzasDashboardPage() {
  const supabase = await createClient()

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesISO = inicioMes.toISOString()

  // Consultas en paralelo
  const [
    cajasRes,
    ingresosRes,
    egresosRes,
    cuotasPendientesRes,
    movimientosRes,
    cotizacionRes,
  ] = await Promise.all([
    // Cajas activas
    supabase
      .from('cajas')
      .select('id, nombre, tipo, moneda, saldo_actual, descripcion, updated_at')
      .eq('tenant_id', TENANT_ID)
      .eq('activa', true)
      .order('nombre'),

    // Ingresos del mes
    supabase
      .from('movimientos_caja')
      .select('monto_neto')
      .eq('tenant_id', TENANT_ID)
      .eq('tipo', 'ingreso')
      .eq('anulado', false)
      .gte('fecha', inicioMesISO),

    // Egresos del mes
    supabase
      .from('movimientos_caja')
      .select('monto_neto')
      .eq('tenant_id', TENANT_ID)
      .eq('tipo', 'egreso')
      .eq('anulado', false)
      .gte('fecha', inicioMesISO),

    // Cuotas pendientes
    supabase
      .from('cuotas_emitidas')
      .select('id, monto_final')
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'pendiente'),

    // Ultimos 10 movimientos
    supabase
      .from('movimientos_caja')
      .select('id, numero, tipo, monto_neto, moneda, fecha, descripcion, anulado, caja:cajas(nombre)')
      .eq('tenant_id', TENANT_ID)
      .eq('anulado', false)
      .order('fecha', { ascending: false })
      .limit(10),

    // Ultima cotizacion USD
    supabase
      .from('cotizaciones')
      .select('fecha, valor_compra, valor_venta, fuente')
      .eq('moneda', 'USD')
      .order('fecha', { ascending: false })
      .limit(1),
  ])

  const cajas = cajasRes.data ?? []
  const ingresos = ingresosRes.data ?? []
  const egresos = egresosRes.data ?? []
  const cuotasPendientes = cuotasPendientesRes.data ?? []
  const movimientos = movimientosRes.data ?? []
  const cotizacion = cotizacionRes.data?.[0] ?? null

  // Calculos
  const totalCajasARS = cajas
    .filter((c) => c.moneda === 'ARS')
    .reduce((sum, c) => sum + (c.saldo_actual ?? 0), 0)

  const totalCajasUSD = cajas
    .filter((c) => c.moneda === 'USD')
    .reduce((sum, c) => sum + (c.saldo_actual ?? 0), 0)

  const totalIngresosMes = ingresos.reduce((sum, m) => sum + (m.monto_neto ?? 0), 0)
  const totalEgresosMes = egresos.reduce((sum, m) => sum + (m.monto_neto ?? 0), 0)

  const cuotasPendientesCount = cuotasPendientes.length
  const cuotasPendientesMonto = cuotasPendientes.reduce((sum, c) => sum + (c.monto_final ?? 0), 0)

  const cotizacionVenta = cotizacion?.valor_venta ?? 0
  const equivalenteUSD = cotizacionVenta > 0 ? totalCajasARS / cotizacionVenta + totalCajasUSD : totalCajasUSD

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Finanzas</h1>
        <p className="text-sm text-muted-foreground">
          Panel financiero del club &mdash; {mesActual}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total en Cajas */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#3A8FC5]/10 p-2">
              <DollarSign className="h-5 w-5 text-[#3A8FC5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMoney(totalCajasARS)}</p>
              <p className="text-xs text-muted-foreground">Total en cajas (ARS)</p>
              {equivalenteUSD > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{formatMoney(equivalenteUSD, 'USD')} equiv.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ingresos del mes */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMoney(totalIngresosMes)}</p>
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            </div>
          </CardContent>
        </Card>

        {/* Egresos del mes */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-red-500/10 p-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMoney(totalEgresosMes)}</p>
              <p className="text-xs text-muted-foreground">Egresos del mes</p>
            </div>
          </CardContent>
        </Card>

        {/* Cuotas pendientes */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#F2C531]/10 p-2">
              <AlertCircle className="h-5 w-5 text-[#F2C531]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cuotasPendientesCount}</p>
              <p className="text-xs text-muted-foreground">Cuotas pendientes</p>
              <p className="text-xs text-muted-foreground">{formatMoney(cuotasPendientesMonto)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cajas overview + Cotizacion */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Cajas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cajas</CardTitle>
              <CardDescription>Estado actual de cada caja del club</CardDescription>
            </CardHeader>
            <CardContent>
              {cajas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay cajas configuradas todavia.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {cajas.map((caja) => {
                    const CajaIcon = CAJA_TIPO_ICONS[caja.tipo] ?? Wallet
                    return (
                      <Link
                        key={caja.id}
                        href={`/admin/finanzas/cajas/${caja.id}`}
                        className="group rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <CajaIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{caja.nombre}</span>
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {caja.moneda}
                          </Badge>
                        </div>
                        <p className="mt-2 text-lg font-bold">
                          {formatMoney(caja.saldo_actual ?? 0, caja.moneda)}
                        </p>
                        {caja.updated_at && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Ult. mov: {formatFechaCorta(caja.updated_at)}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cotizacion USD */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cotizacion USD</CardTitle>
            </CardHeader>
            <CardContent>
              {cotizacion ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Compra</span>
                    <span className="font-medium">
                      {formatMoney(cotizacion.valor_compra ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Venta</span>
                    <span className="font-medium">
                      {formatMoney(cotizacion.valor_venta ?? 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Fuente: {cotizacion.fuente ?? 'N/A'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Fecha: {formatFecha(cotizacion.fecha)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin cotizacion disponible.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/admin/finanzas/movimientos/nuevo?tipo=ingreso" />}>
            <Plus className="h-4 w-4" />
            Nuevo Ingreso
          </Button>
          <Button
            variant="destructive"
            render={<Link href="/admin/finanzas/movimientos/nuevo?tipo=egreso" />}
          >
            <Minus className="h-4 w-4" />
            Nuevo Egreso
          </Button>
          <Button
            variant="outline"
            render={<Link href="/admin/finanzas/transferencias/nueva" />}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferencia
          </Button>
          <Button
            variant="secondary"
            render={<Link href="/admin/finanzas/cuotas/emitir" />}
          >
            <Receipt className="h-4 w-4" />
            Emitir Cuotas
          </Button>
        </CardContent>
      </Card>

      {/* Ultimos movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ultimos movimientos</CardTitle>
          <CardDescription>Los 10 movimientos mas recientes</CardDescription>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay movimientos registrados todavia.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Caja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => {
                  const TipoIcon = TIPO_ICONS[mov.tipo] ?? DollarSign
                  const badgeVariant = TIPO_BADGE_VARIANT[mov.tipo] ?? 'outline'
                  const cajaName =
                    mov.caja && typeof mov.caja === 'object' && 'nombre' in mov.caja
                      ? (mov.caja as { nombre: string }).nombre
                      : '—'

                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="text-muted-foreground">
                        {formatFechaCorta(mov.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant} className="gap-1">
                          <TipoIcon className="h-3 w-3" />
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {mov.descripcion || '—'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          mov.tipo === 'egreso' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {mov.tipo === 'egreso' ? '- ' : '+ '}
                        {formatMoney(mov.monto_neto ?? 0, mov.moneda ?? 'ARS')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cajaName}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
