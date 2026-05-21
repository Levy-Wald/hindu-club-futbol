import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

export function SeccionPlantelPropio({
  eventoId,
  equipoId,
  equipoNombre,
  tenantId,
}: {
  eventoId: string
  equipoId: string | null
  equipoNombre: string | null
  tenantId: string
}) {
  return (
    <div className="border rounded-lg p-4 mb-4" data-testid="seccion-plantel-propio">
      <h3 className="font-semibold text-sm mb-3">Plantel propio</h3>

      {equipoId ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{equipoNombre ?? 'Equipo'}</span>
          </div>
          <Link
            href={`/admin/${tenantId}/operaciones/eventos/${eventoId}/asistencia`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Gestionar convocatoria
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Asigná un equipo al evento para gestionar la convocatoria.
        </p>
      )}
    </div>
  )
}
