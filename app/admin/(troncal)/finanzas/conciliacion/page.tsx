import { fetchCajasBancarias } from '@/modules/finanzas/lib/conciliacion'
import { fetchCuentasImputables } from '@/modules/finanzas/lib/queries'
import { ConciliacionClient } from './_components/conciliacion-client'

export default async function ConciliacionPage() {
  const [cajas, cuentas] = await Promise.all([
    fetchCajasBancarias(),
    fetchCuentasImputables(),
  ])

  return (
    <ConciliacionClient
      cajas={cajas}
      cuentas={cuentas}
    />
  )
}
