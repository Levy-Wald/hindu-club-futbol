import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Wallet } from 'lucide-react'
import type { CuentaCorrienteProveedor } from '../../_lib/queries'

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

interface Props {
  cuenta: CuentaCorrienteProveedor | null
}

export function ProveedorCuentaCorriente({ cuenta }: Props) {
  if (!cuenta) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Wallet className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Este proveedor todavía no tiene cuenta corriente.
        </CardContent>
      </Card>
    )
  }

  // saldo > 0 = a favor del proveedor (le debemos); saldo < 0 = a favor del club.
  const aFavorProveedor = cuenta.saldo > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cuenta corriente</CardTitle>
          <Badge variant={cuenta.activa ? 'default' : 'secondary'}>
            {cuenta.activa ? 'activa' : 'inactiva'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo (ARS)</p>
              <p className="text-2xl font-bold tabular-nums">{formatARS(cuenta.saldo)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {cuenta.saldo === 0 ? 'Sin saldo pendiente' : aFavorProveedor ? 'A favor del proveedor (deuda del club)' : 'A favor del club'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo (USD)</p>
              <p className="text-2xl font-bold tabular-nums">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(cuenta.saldo_usd)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cuenta.ultimo_movimiento_at
                  ? `Último movimiento: ${new Date(cuenta.ultimo_movimiento_at).toLocaleDateString('es-AR')}`
                  : 'Sin movimientos registrados'}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/admin/finanzas/cuenta-corriente">
              <Button variant="outline" size="sm">
                Ver detalle en Finanzas
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
