import { listarInscripciones } from '../lib/inscripciones-actions'
import { listarTorneos, listarFederaciones, listarEquiposPropios } from '../lib/queries'
import { canAdministrarTorneos } from '../lib/permisos'
import { InscripcionesClient } from './inscripciones-client'

export async function PantallaInscripciones({
  personaId,
  tenantId,
}: {
  personaId: string
  tenantId: string
}) {
  const [inscripciones, torneos, federaciones, equiposPropios, puedeAdmin] = await Promise.all([
    listarInscripciones(tenantId),
    listarTorneos(tenantId, { tipo: 'externo' }),
    listarFederaciones(tenantId),
    listarEquiposPropios(tenantId),
    canAdministrarTorneos(personaId),
  ])

  return (
    <InscripcionesClient
      inscripciones={inscripciones}
      torneosExternos={torneos}
      federaciones={federaciones}
      equiposPropios={equiposPropios}
      puedeAdmin={puedeAdmin}
    />
  )
}
