'use client'

import { useState } from 'react'
import { PlanHeader } from './plan-header'
import { ListaBloques } from './lista-bloques'
import type { PlanEntrenamiento, Bloque, Ejercicio } from '../lib/types'

export function ListaBloquesWrapper({
  planCompleto,
  eventoId,
  puedeEditar,
  ejercicios,
}: {
  planCompleto: { plan: PlanEntrenamiento | null; bloques: Bloque[] }
  eventoId: string
  puedeEditar: boolean
  ejercicios: Ejercicio[]
}) {
  const [planId, setPlanId] = useState(planCompleto.plan?.id ?? undefined)

  const duracionCalculada = planCompleto.bloques.reduce(
    (sum, b) => sum + (b.duracion_min ?? b.ejercicio?.duracion_min_sugerida ?? 0),
    0
  )

  return (
    <>
      <PlanHeader
        plan={planCompleto.plan}
        eventoId={eventoId}
        duracionCalculada={duracionCalculada}
        puedeEditar={puedeEditar}
        onPlanCreated={(id) => setPlanId(id)}
      />

      <ListaBloques
        bloques={planCompleto.bloques}
        planId={planId}
        eventoId={eventoId}
        puedeEditar={puedeEditar}
        ejercicios={ejercicios}
      />
    </>
  )
}
