import { listarMovimientos } from '@/modules/pim/lib/queries'
import { MovimientosPageClient } from './_components/movimientos-page-client'

export default async function MovimientosStockPage() {
  const movimientos = await listarMovimientos(undefined, 100)

  return <MovimientosPageClient movimientos={movimientos} />
}
