import { obtenerTorneo, listarFederaciones, listarNivelesCompetencia, listarEquiposPropios } from '../lib/queries'
import { canAdministrarTorneos } from '../lib/permisos'
import { DetalleTorneoClient } from './detalle-torneo-client'

export async function PantallaDetalleTorneo({
  personaId,
  tenantId,
  torneoId,
}: {
  personaId: string
  tenantId: string
  torneoId: string
}) {
  const [data, federaciones, niveles, equiposPropios, puedeAdmin] = await Promise.all([
    obtenerTorneo(tenantId, torneoId),
    listarFederaciones(tenantId),
    listarNivelesCompetencia(),
    listarEquiposPropios(tenantId),
    canAdministrarTorneos(personaId),
  ])

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Torneo no encontrado.
      </div>
    )
  }

  return (
    <DetalleTorneoClient
      torneo={data.torneo}
      categorias={data.categorias}
      equipos={data.equipos}
      federaciones={federaciones}
      niveles={niveles}
      equiposPropios={equiposPropios}
      puedeAdmin={puedeAdmin}
    />
  )
}
