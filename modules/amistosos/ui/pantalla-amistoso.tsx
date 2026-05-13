import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { obtenerAmistoso } from '../lib/queries'
import { canEditarAmistoso } from '../lib/permisos'
import { HeaderAmistoso } from './header-amistoso'
import { SeccionLogistica } from './seccion-logistica'
import { SeccionNominaRival } from './seccion-nomina-rival'
import { SeccionPlantelPropio } from './seccion-plantel-propio'

export async function PantallaAmistoso({
  eventoId,
  personaId,
  tenantId,
}: {
  eventoId: string
  personaId: string
  tenantId: string
}) {
  const [amistoso, puedeEditar] = await Promise.all([
    obtenerAmistoso(eventoId, tenantId),
    canEditarAmistoso(personaId, eventoId),
  ])

  if (!amistoso) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground text-sm">Este evento no es un amistoso o no existe.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl" data-testid="pantalla-amistoso">
      <div className="mb-4">
        <Link
          href={`/admin/operaciones/eventos/${eventoId}/asistencia`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al evento
        </Link>
        <h1 className="text-2xl font-bold">Partido amistoso</h1>
      </div>

      <HeaderAmistoso evento={amistoso.evento} />

      <SeccionLogistica
        eventoId={eventoId}
        logisticaInicial={amistoso.logistica}
        puedeEditar={puedeEditar}
      />

      <SeccionNominaRival
        eventoId={eventoId}
        nominaId={amistoso.nomina_externa_id}
        nominaToken={amistoso.nomina_externa_token}
        nominaEstado={amistoso.nomina_externa_estado}
        clubRivalNombre={amistoso.logistica.club_rival_nombre}
        puedeEditar={puedeEditar}
      />

      <SeccionPlantelPropio
        eventoId={eventoId}
        equipoId={amistoso.evento.equipo_id}
        equipoNombre={amistoso.evento.equipo_nombre}
      />
    </div>
  )
}
