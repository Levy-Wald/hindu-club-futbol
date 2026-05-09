import Link from 'next/link'
import { getSyncHistory, getPadrones } from './_lib/queries'
import { SincronizarClient } from './_components/sincronizar-client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function SincronizarPadronPage() {
  const [syncs, padrones] = await Promise.all([
    getSyncHistory(),
    getPadrones(),
  ])

  if (padrones.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/padrones">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Sincronizar padron</h1>
        </div>
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">
            Esta pantalla es para el flujo legacy de padron mensual.
            Para sincronizar un padron nuevo, anda a Padrones, selecciona tu padron y usa el boton &quot;Sincronizar&quot;.
          </p>
          <Link href="/admin/padrones">
            <Button variant="outline">Ir a Padrones</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sincronizar padron</h1>
        <p className="text-muted-foreground">
          Subi el Excel mensual del club para detectar altas, bajas y cambios
        </p>
      </div>

      <SincronizarClient syncs={syncs} padrones={padrones} />
    </div>
  )
}
