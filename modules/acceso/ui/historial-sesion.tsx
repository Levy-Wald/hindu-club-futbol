'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LecturaHistorial, VeredictoAcceso } from '../lib/types'

const COLOR: Record<VeredictoAcceso, string> = {
  verde: 'bg-green-100 text-green-700',
  amarillo: 'bg-yellow-100 text-yellow-700',
  rojo: 'bg-red-100 text-red-700',
}

type Props = {
  lecturas: LecturaHistorial[]
}

export function HistorialSesion({ lecturas }: Props) {
  const [open, setOpen] = useState(false)

  if (lecturas.length === 0) return null

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden" data-testid="historial-lecturas">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-neutral-700">
          Historial de la sesión ({lecturas.length})
        </h3>
        {open ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
      </button>
      {open && (
        <div className="border-t border-neutral-100 divide-y divide-neutral-50">
          {lecturas.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded', COLOR[l.veredicto])}>
                {l.veredicto.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800 truncate">
                  {l.nombre && l.apellido ? `${l.apellido}, ${l.nombre}` : `DNI: ${l.dni}`}
                </p>
              </div>
              <span className="text-xs text-neutral-400 shrink-0">
                {new Date(l.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
