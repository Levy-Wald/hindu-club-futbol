'use client'

import Link from 'next/link'
import type { EventoCalendarioItem } from './types'

export function ModalDetalleEvento({
  evento,
  onClose,
  tenantId,
}: {
  evento: EventoCalendarioItem
  onClose: () => void
  tenantId: string
}) {
  const horaStr = (h: string | null) => {
    if (!h) return '--:--'
    return h.slice(0, 5)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-detalle-evento"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">{evento.titulo ?? '(sin titulo)'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-28">Fecha</dt>
            <dd>{new Date(evento.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-28">Horario</dt>
            <dd>{horaStr(evento.hora_inicio)} - {horaStr(evento.hora_fin)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-28">Tipo</dt>
            <dd className="capitalize">{evento.tipo_evento_slug.replace(/_/g, ' ')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground w-28">Origen</dt>
            <dd className="capitalize">{evento.modulo_origen}</dd>
          </div>
          {evento.equipo_nombre && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-28">Equipo</dt>
              <dd>{evento.equipo_nombre}</dd>
            </div>
          )}
          {evento.cancha_nombre && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-28">Cancha</dt>
              <dd>{evento.cancha_nombre}</dd>
            </div>
          )}
          {evento.estado !== 'programado' && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-28">Estado</dt>
              <dd className="capitalize">{evento.estado}</dd>
            </div>
          )}
          {evento.es_recurrente && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground w-28">Serie</dt>
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
            href={`/admin/${tenantId}/operaciones/eventos/${evento.id}`}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Ver detalle completo
          </Link>
        </div>
      </div>
    </div>
  )
}
