import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export default function PortalCuentaPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi cuenta</h1>
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Wallet className="h-8 w-8 mx-auto mb-3 opacity-40" />
          El detalle de cuotas, saldo y pagos llega en el próximo sub-sprint del portal.
        </CardContent>
      </Card>
    </div>
  )
}
