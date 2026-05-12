'use client'

import { useState } from 'react'
import { crearOActualizarPlanAction } from '../lib/actions'
import type { PlanEntrenamiento, Intensidad } from '../lib/types'

const INTENSIDADES: { value: Intensidad; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'muy_alta', label: 'Muy alta' },
]

export function PlanHeader({
  plan,
  eventoId,
  duracionCalculada,
  puedeEditar,
  onPlanCreated,
}: {
  plan: PlanEntrenamiento | null
  eventoId: string
  duracionCalculada: number
  puedeEditar: boolean
  onPlanCreated?: (planId: string) => void
}) {
  const [editando, setEditando] = useState(false)
  const [objetivo, setObjetivo] = useState(plan?.objetivo ?? '')
  const [intensidad, setIntensidad] = useState<Intensidad | ''>(plan?.nivel_intensidad ?? '')
  const [notas, setNotas] = useState(plan?.notas_dt ?? '')
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async () => {
    setGuardando(true)
    const result = await crearOActualizarPlanAction({
      evento_id: eventoId,
      objetivo: objetivo || null,
      nivel_intensidad: (intensidad as Intensidad) || null,
      notas_dt: notas || null,
    })
    setGuardando(false)
    if (result.ok) {
      setEditando(false)
      onPlanCreated?.(result.plan_id)
    }
  }

  if (!plan && !editando) {
    return puedeEditar ? (
      <div className="border rounded-lg p-6 mb-4 text-center">
        <p className="text-muted-foreground text-sm mb-3">
          Este entrenamiento no tiene un plan creado.
        </p>
        <button
          onClick={() => setEditando(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          data-testid="btn-crear-plan"
        >
          Crear plan de entrenamiento
        </button>
      </div>
    ) : (
      <div className="border rounded-lg p-6 mb-4 text-center">
        <p className="text-muted-foreground text-sm">No hay plan de entrenamiento para este evento.</p>
      </div>
    )
  }

  if (editando) {
    return (
      <div className="border rounded-lg p-4 mb-4 space-y-3">
        <div>
          <label className="text-sm font-medium">Objetivo</label>
          <input
            type="text"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ej: Mejorar transiciones defensa-ataque"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Intensidad general</label>
          <select
            value={intensidad}
            onChange={(e) => setIntensidad(e.target.value as Intensidad | '')}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Sin definir</option>
            {INTENSIDADES.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Notas del DT</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Notas internas..."
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditando(false)} className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            data-testid="btn-guardar-plan"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {plan?.objetivo && (
            <p className="text-sm"><span className="font-medium text-muted-foreground">Objetivo:</span> {plan.objetivo}</p>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span data-testid="plan-duracion-total">Duración: {duracionCalculada} min</span>
            {plan?.nivel_intensidad && (
              <span data-testid="plan-intensidad-resumen" className="capitalize">
                Intensidad: {plan.nivel_intensidad.replace('_', ' ')}
              </span>
            )}
          </div>
          {plan?.notas_dt && <p className="text-xs text-muted-foreground italic mt-1">{plan.notas_dt}</p>}
        </div>
        {puedeEditar && (
          <button onClick={() => setEditando(true)} className="text-sm text-primary hover:underline">
            Editar
          </button>
        )}
      </div>
    </div>
  )
}
