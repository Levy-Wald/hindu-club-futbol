'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export function TogglePlanificador({
  vistaActual,
}: {
  vistaActual: 'mensual' | 'semanal'
}) {
  return (
    <div className="flex gap-1 border rounded-md p-1" data-testid="toggle-planificador">
      <Link
        href="/admin/planificadores/mensual"
        className={cn(
          'px-3 py-1 text-sm rounded-sm transition-colors',
          vistaActual === 'mensual'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-muted-foreground'
        )}
        data-testid="toggle-vista-mes"
      >
        Mes
      </Link>
      <Link
        href="/admin/planificadores/semanal"
        className={cn(
          'px-3 py-1 text-sm rounded-sm transition-colors',
          vistaActual === 'semanal'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-muted-foreground'
        )}
        data-testid="toggle-vista-semana"
      >
        Semana
      </Link>
    </div>
  )
}
