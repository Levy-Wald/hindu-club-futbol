'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { verificarAccesoAction } from '../lib/actions'
import { BuscadorDni } from './buscador-dni'
import { CardVeredicto } from './card-veredicto'
import { ListaEventosHoy } from './lista-eventos-hoy'
import { HistorialSesion } from './historial-sesion'
import type { ResultadoVerificacion, LecturaHistorial } from '../lib/types'

type Props = {
  guardiaNombre: string
}

export function PantallaAcceso({ guardiaNombre }: Props) {
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [historial, setHistorial] = useState<LecturaHistorial[]>([])

  const handleBuscar = async (dni: string) => {
    setIsLoading(true)
    setResultado(null)
    setNoEncontrado(false)

    const res = await verificarAccesoAction({ dni })
    setIsLoading(false)

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    const r = res.data.resultado
    if (!r) {
      setNoEncontrado(true)
      setHistorial(prev => [
        { id: crypto.randomUUID(), dni, nombre: null, apellido: null, veredicto: 'rojo' as const, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 5))
      return
    }

    setResultado(r)
    setHistorial(prev => [
      { id: r.acceso_log_id, dni: r.dni, nombre: r.nombre, apellido: r.apellido, veredicto: r.veredicto, timestamp: new Date().toISOString() },
      ...prev,
    ].slice(0, 5))
  }

  const handleNuevaBusqueda = () => {
    setResultado(null)
    setNoEncontrado(false)
  }

  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-4 pb-20" data-testid="pantalla-acceso">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Control de Acceso</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {guardiaNombre} · {fecha}
        </p>
      </div>

      {/* Buscador o resultado */}
      {!resultado && !noEncontrado ? (
        <BuscadorDni onBuscar={handleBuscar} isLoading={isLoading} />
      ) : noEncontrado ? (
        <div data-testid="card-veredicto">
          <div
            data-testid="veredicto-color-rojo"
            className="bg-red-500 rounded-2xl px-6 py-8 text-white text-center shadow-lg"
          >
            <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-black">?</span>
            </div>
            <p className="text-2xl font-black tracking-wide">NO ENCONTRADO</p>
            <p className="text-sm mt-1 opacity-90">El DNI ingresado no está registrado en el sistema</p>
          </div>
          <button
            type="button"
            onClick={handleNuevaBusqueda}
            data-testid="btn-nueva-busqueda"
            className="mt-4 w-full h-12 rounded-xl border-2 border-neutral-300 text-neutral-700 font-semibold
                       hover:bg-neutral-50 transition-colors"
          >
            Nueva búsqueda
          </button>
        </div>
      ) : resultado ? (
        <div className="space-y-4">
          <CardVeredicto resultado={resultado} />

          {resultado.invitaciones_hoy.length > 0 && (
            <ListaEventosHoy
              eventos={resultado.invitaciones_hoy}
              personaId={resultado.persona_id}
              personaNombre={`${resultado.apellido}, ${resultado.nombre}`}
              accesoLogId={resultado.acceso_log_id}
            />
          )}

          <button
            type="button"
            onClick={handleNuevaBusqueda}
            data-testid="btn-nueva-busqueda"
            className="w-full h-12 rounded-xl border-2 border-neutral-300 text-neutral-700 font-semibold
                       hover:bg-neutral-50 transition-colors"
          >
            Nueva búsqueda
          </button>
        </div>
      ) : null}

      {/* Historial */}
      <HistorialSesion lecturas={historial} />
    </div>
  )
}
