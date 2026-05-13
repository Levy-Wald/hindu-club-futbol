'use client'

import { useState } from 'react'
import { actualizarLogisticaAction } from '../lib/actions'
import type { LogisticaAmistoso } from '../lib/types'

export function SeccionLogistica({
  eventoId,
  logisticaInicial,
  puedeEditar,
}: {
  eventoId: string
  logisticaInicial: LogisticaAmistoso
  puedeEditar: boolean
}) {
  const [logistica, setLogistica] = useState<LogisticaAmistoso>(logisticaInicial)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const handleChange = (field: keyof LogisticaAmistoso, value: string) => {
    setLogistica(prev => ({ ...prev, [field]: value || null }))
    setGuardado(false)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    const result = await actualizarLogisticaAction({
      evento_id: eventoId,
      logistica,
    })
    setGuardando(false)
    if (result.ok) setGuardado(true)
  }

  return (
    <div className="border rounded-lg p-4 mb-4" data-testid="seccion-logistica">
      <h3 className="font-semibold text-sm mb-3">Logística</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium">Club rival</label>
          <input
            type="text"
            value={logistica.club_rival_nombre ?? ''}
            onChange={(e) => handleChange('club_rival_nombre', e.target.value)}
            placeholder="Nombre del club rival"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
            disabled={!puedeEditar}
            data-testid="input-club-rival"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Camiseta local</label>
            <input
              type="text"
              value={logistica.color_camiseta_home ?? ''}
              onChange={(e) => handleChange('color_camiseta_home', e.target.value)}
              placeholder="Ej: Blanco"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
              disabled={!puedeEditar}
              data-testid="input-color-camiseta-home"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Camiseta visitante</label>
            <input
              type="text"
              value={logistica.color_camiseta_away ?? ''}
              onChange={(e) => handleChange('color_camiseta_away', e.target.value)}
              placeholder="Ej: Azul"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
              disabled={!puedeEditar}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Contacto rival (nombre)</label>
            <input
              type="text"
              value={logistica.contacto_rival_nombre ?? ''}
              onChange={(e) => handleChange('contacto_rival_nombre', e.target.value)}
              placeholder="Nombre del contacto"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
              disabled={!puedeEditar}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Teléfono rival</label>
            <input
              type="text"
              value={logistica.contacto_rival_telefono ?? ''}
              onChange={(e) => handleChange('contacto_rival_telefono', e.target.value)}
              placeholder="+54 11 1234-5678"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
              disabled={!puedeEditar}
              data-testid="input-contacto-rival-telefono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Email rival</label>
          <input
            type="email"
            value={logistica.contacto_rival_email ?? ''}
            onChange={(e) => handleChange('contacto_rival_email', e.target.value)}
            placeholder="contacto@clubrival.com"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
            disabled={!puedeEditar}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Observaciones</label>
          <textarea
            value={logistica.observaciones ?? ''}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
            disabled={!puedeEditar}
            data-testid="textarea-observaciones"
          />
        </div>

        {puedeEditar && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              data-testid="btn-guardar-logistica"
            >
              {guardando ? 'Guardando...' : 'Guardar logística'}
            </button>
            {guardado && (
              <span className="text-xs text-green-600">Guardado</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
