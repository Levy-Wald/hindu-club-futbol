import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export default function CajasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Cajas</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            Proximamente: cuotas, pagos, movimientos y cuentas corrientes.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Este modulo esta en desarrollo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
