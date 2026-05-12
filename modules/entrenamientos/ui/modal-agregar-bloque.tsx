'use client'

import { useState } from 'react'
import type { Ejercicio, Intensidad } from '../lib/types'

export function ModalAgregarBloque({
  ejercicios,
  onConfirm,
  onCancel,
}: {
  ejercicios: Ejercicio[]
  onConfirm: (data: {
    ejercicio_id: string | null
    nombre_personalizado: string | null
    duracion_min: number | null
    repeticiones: number | null
    series: number | null
    intensidad_override: Intensidad | null
    notas_bloque: string | null
  }) => void
  onCancel: () => void
}) {
  const [modo, setModo] = useState<'catalogo' | 'libre'>('catalogo')
  const [ejercicioId, setEjercicioId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [nombreLibre, setNombreLibre] = useState('')
  const [duracion, setDuracion] = useState('')
  const [repeticiones, setRepeticiones] = useState('')
  const [series, setSeries] = useState('')
  const [intensidad, setIntensidad] = useState<Intensidad | ''>('')
  const [notas, setNotas] = useState('')

  const ejerciciosFiltrados = busqueda
    ? ejercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : ejercicios

  const ejercicioSeleccionado = ejercicios.find(e => e.id === ejercicioId)

  const handleSubmit = () => {
    if (modo === 'catalogo' && !ejercicioId) return
    if (modo === 'libre' && !nombreLibre.trim()) return

    onConfirm({
      ejercicio_id: modo === 'catalogo' ? ejercicioId : null,
      nombre_personalizado: modo === 'libre' ? nombreLibre.trim() : null,
      duracion_min: duracion ? parseInt(duracion) : null,
      repeticiones: repeticiones ? parseInt(repeticiones) : null,
      series: series ? parseInt(series) : null,
      intensidad_override: intensidad || null,
      notas_bloque: notas.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-agregar-bloque"
      >
        <h2 className="text-lg font-semibold mb-4">Agregar bloque</h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModo('catalogo')}
            className={`px-3 py-1.5 text-sm rounded-md border ${modo === 'catalogo' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            Del catálogo
          </button>
          <button
            onClick={() => setModo('libre')}
            className={`px-3 py-1.5 text-sm rounded-md border ${modo === 'libre' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            data-testid="btn-modo-libre"
          >
            Bloque libre
          </button>
        </div>

        {modo === 'catalogo' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              data-testid="select-ejercicio"
            />
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {ejerciciosFiltrados.map(ej => (
                <button
                  key={ej.id}
                  onClick={() => setEjercicioId(ej.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent border-b last:border-b-0 ${ej.id === ejercicioId ? 'bg-accent' : ''}`}
                >
                  <div className="font-medium">{ej.nombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {ej.categoria} · {ej.duracion_min_sugerida ?? '?'} min · {ej.intensidad ?? 'sin intensidad'}
                  </div>
                </button>
              ))}
            </div>
            {ejercicioSeleccionado && (
              <p className="text-xs text-muted-foreground">{ejercicioSeleccionado.descripcion}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium">Nombre del bloque</label>
            <input
              type="text"
              value={nombreLibre}
              onChange={(e) => setNombreLibre(e.target.value)}
              placeholder="Ej: Partido final libre"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
              data-testid="input-nombre-libre"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div>
            <label className="text-xs font-medium">Duración (min)</label>
            <input type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)}
              className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium">Repeticiones</label>
            <input type="number" value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)}
              className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium">Series</label>
            <input type="number" value={series} onChange={(e) => setSeries(e.target.value)}
              className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm bg-background" />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs font-medium">Notas</label>
          <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas opcionales..."
            className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background" />
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={(modo === 'catalogo' && !ejercicioId) || (modo === 'libre' && !nombreLibre.trim())}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            data-testid="btn-confirmar-bloque"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
