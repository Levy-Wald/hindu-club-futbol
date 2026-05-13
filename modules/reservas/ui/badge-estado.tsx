'use client'

import type { EstadoReserva } from '../lib/types'

const CONFIG: Record<EstadoReserva, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' },
  confirmada: { label: 'Confirmada', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  pagada: { label: 'Pagada', className: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  completada: { label: 'Completada', className: 'bg-gray-500/15 text-gray-700 dark:text-gray-400' },
}

export function BadgeEstado({ estado }: { estado: EstadoReserva }) {
  const cfg = CONFIG[estado] ?? CONFIG.pendiente
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
      data-testid={`badge-estado-${estado}`}
    >
      {cfg.label}
    </span>
  )
}
