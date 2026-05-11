import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Banknote,
  Building2,
  Smartphone,
  Wallet,
  ArrowRight,
} from 'lucide-react'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function tipoIcon(tipo: string) {
  switch (tipo) {
    case 'efectivo':
      return Banknote
    case 'banco':
      return Building2
    case 'digital':
      return Smartphone
    default:
      return Wallet
  }
}

function tipoLabel(tipo: string) {
  switch (tipo) {
    case 'efectivo':
      return 'Efectivo'
    case 'banco':
      return 'Banco'
    case 'digital':
      return 'Digital'
    default:
      return tipo
  }
}

export default async function CajasPage() {
  const supabase = await createClient()

  // Fetch cajas with responsable info
  const { data: cajas, error } = await supabase
    .from('cajas')
    .select(`
      id,
      nombre,
      tipo,
      saldo_actual,
      moneda,
      activa,
      responsable_id,
      cuenta_contable_id,
      created_at,
      responsable:personas!cajas_responsable_id_fkey(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  // Fetch latest cotizacion for USD equivalent
  const { data: cotizacion } = await supabase
    .from('cotizaciones_moneda')
    .select('tasa_venta')
    .eq('tenant_id', TENANT_ID)
    .eq('moneda_origen', 'USD')
    .eq('moneda_destino', 'ARS')
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tasaUsd = cotizacion?.tasa_venta ?? null

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">Cajas</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Error al cargar cajas: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate totals
  const totalArs = (cajas ?? [])
    .filter((c) => c.activa && c.moneda === 'ARS')
    .reduce((sum, c) => sum + (c.saldo_actual ?? 0), 0)

  const totalUsd = (cajas ?? [])
    .filter((c) => c.activa && c.moneda === 'USD')
    .reduce((sum, c) => sum + (c.saldo_actual ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Cajas</h1>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total ARS</p>
            <p className="text-2xl font-bold">{formatMoney(totalArs, 'ARS')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total USD</p>
            <p className="text-2xl font-bold">{formatMoney(totalUsd, 'USD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cotizacion USD/ARS</p>
            <p className="text-2xl font-bold">
              {tasaUsd ? formatMoney(tasaUsd, 'ARS') : 'Sin cotizacion'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cajas grid */}
      {!cajas || cajas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay cajas registradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea una caja para comenzar a registrar movimientos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cajas.map((caja) => {
            const Icon = tipoIcon(caja.tipo)
            const responsableRaw = caja.responsable as unknown
            const responsable = (Array.isArray(responsableRaw) ? responsableRaw[0] : responsableRaw) as { id: string; nombre: string; apellido: string } | null
            const saldoUsdEquiv =
              caja.moneda === 'ARS' && tasaUsd && caja.saldo_actual != null
                ? caja.saldo_actual / tasaUsd
                : caja.moneda === 'USD'
                  ? caja.saldo_actual
                  : null

            return (
              <Card
                key={caja.id}
                className={`relative transition-colors hover:bg-muted/50 ${!caja.activa ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{caja.nombre}</CardTitle>
                        <p className="text-xs text-muted-foreground">{tipoLabel(caja.tipo)}</p>
                      </div>
                    </div>
                    <Badge variant={caja.activa ? 'default' : 'secondary'}>
                      {caja.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatMoney(caja.saldo_actual, caja.moneda ?? 'ARS')}
                    </p>
                    {saldoUsdEquiv != null && caja.moneda === 'ARS' && (
                      <p className="text-xs text-muted-foreground">
                        ~{formatMoney(saldoUsdEquiv, 'USD')} equiv.
                      </p>
                    )}
                  </div>

                  {responsable && (
                    <p className="text-xs text-muted-foreground">
                      Responsable: {responsable.apellido}, {responsable.nombre}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    render={<Link href={`/admin/finanzas/cajas/${caja.id}`} />}
                  >
                    Ver detalle
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
