import { listarTorneos, listarFederaciones } from '../lib/queries'
import { canAdministrarTorneos } from '../lib/permisos'
import { TablaTorneos } from './tabla-torneos'

export async function PantallaListadoTorneos({
  personaId,
  tenantId,
}: {
  personaId: string
  tenantId: string
}) {
  const [torneos, federaciones, puedeAdmin] = await Promise.all([
    listarTorneos(tenantId),
    listarFederaciones(tenantId),
    canAdministrarTorneos(personaId),
  ])

  return (
    <TablaTorneos
      torneos={torneos}
      federaciones={federaciones}
      puedeAdmin={puedeAdmin}
    />
  )
}
