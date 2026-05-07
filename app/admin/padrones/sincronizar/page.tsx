import { getSyncHistory, getPadrones } from './_lib/queries'
import { SincronizarClient } from './_components/sincronizar-client'

export default async function SincronizarPadronPage() {
  const [syncs, padrones] = await Promise.all([
    getSyncHistory(),
    getPadrones(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sincronizar padrón</h1>
        <p className="text-muted-foreground">
          Subí el Excel mensual del club para detectar altas, bajas y cambios
        </p>
      </div>

      <SincronizarClient syncs={syncs} padrones={padrones} />
    </div>
  )
}
