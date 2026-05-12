'use client'

import Link from 'next/link'
import type { EventoCalendar } from '../lib/types'

export function ModalDetalleEvento({
  evento,
  onClose,
}: {
  evento: EventoCalendar
  onClose: () => void
}) {
  const r = evento.resource
  const horaStr = (d: Date) =>
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-detalle-evento"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">{evento.titulo}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-24">Fecha</dt>
            <dd>{evento.start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-24">Horario</dt>
            <dd>{horaStr(evento.start)} – {horaStr(evento.end)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-24">Tipo</dt>
            <dd className="capitalize">{r.tipo_evento_slug.replace(/_/g, ' ')}</dd>
          </div>
          {r.equipo_nombre && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-24">Equipo</dt>
              <dd>{r.equipo_nombre}</dd>
            </div>
          )}
          {r.cancha_nombre && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-24">Cancha</dt>
              <dd>{r.cancha_nombre}</dd>
            </div>
          )}
          {r.es_recurrente && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-24">Serie</dt>
              <dd className="text-blue-600">Evento recurrente</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Cerrar
          </button>
          <Link
            href={`/admin/operaciones/eventos/${evento.id}`}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            data-testid="btn-detalle-completo"
          >
            Ver detalle completo
          </Link>
        </div>
      </div>
    </div>
  )
}
