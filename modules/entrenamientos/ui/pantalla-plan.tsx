import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { obtenerPlanPorEvento, listarEjerciciosCatalogo } from '../lib/queries'
import { canEditarPlan } from '../lib/permisos'
import { PlanHeader } from './plan-header'
import { ListaBloquesWrapper } from './lista-bloques-wrapper'

export async function PantallaPlan({
  eventoId,
  eventoTitulo,
  personaId,
  tenantId,
}: {
  eventoId: string
  eventoTitulo: string
  personaId: string
  tenantId: string
}) {
  const [planCompletoRaw, ejercicios, puedeEditar] = await Promise.all([
    obtenerPlanPorEvento(eventoId, tenantId),
    listarEjerciciosCatalogo(tenantId),
    canEditarPlan(personaId, eventoId),
  ])

  const planCompleto = planCompletoRaw ?? {
    plan: null,
    bloques: [],
    duracion_total_calculada: 0,
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-4">
        <Link
          href={`/admin/${tenantId}/operaciones/eventos/${eventoId}/asistencia`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al evento
        </Link>
        <h1 className="text-2xl font-bold">Plan de entrenamiento</h1>
        <p className="text-sm text-muted-foreground">{eventoTitulo}</p>
      </div>

      <ListaBloquesWrapper
        planCompleto={planCompleto}
        eventoId={eventoId}
        puedeEditar={puedeEditar}
        ejercicios={ejercicios}
      />
    </div>
  )
}
