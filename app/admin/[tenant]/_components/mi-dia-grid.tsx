'use client'

import { useCapabilities, useUserAttributes, usePersonaId } from '@/lib/permissions/capabilities-context'
import { WIDGET_REGISTRY } from '@/lib/dashboard/widget-registry'
import { shouldShowWidget } from '@/lib/dashboard/types'
import { SaludoWidget } from './widgets/saludo-widget'
import { MiMembresiaWidget } from './widgets/mi-membresia-widget'
import { MiActividadDeportivaWidget } from './widgets/mi-actividad-deportiva-widget'
import { PendientesAdminWidget } from './widgets/pendientes-admin-widget'
import { CuotasVencidasWidget } from './widgets/cuotas-vencidas-widget'
import { SaludClubWidget } from './widgets/salud-club-widget'
import { MisTareasWidget } from './widgets/mis-tareas-widget'
import { ComunicacionesWidget } from './widgets/comunicaciones-widget'
import type { WidgetDef, WidgetSize } from '@/lib/dashboard/types'

const SIZE_CLASS: Record<WidgetSize, string> = {
  lg: 'col-span-1 md:col-span-2 lg:col-span-3',
  md: 'col-span-1 md:col-span-2 lg:col-span-2',
  sm: 'col-span-1',
}

function renderWidget(id: string, nombre: string) {
  switch (id) {
    case 'saludo':
      return <SaludoWidget nombre={nombre} />
    case 'mi-membresia':
      return <MiMembresiaWidget />
    case 'mi-actividad-deportiva':
      return <MiActividadDeportivaWidget />
    case 'pendientes-admin':
      return <PendientesAdminWidget />
    case 'cuotas-vencidas':
      return <CuotasVencidasWidget />
    case 'salud-club':
      return <SaludClubWidget />
    case 'mis-tareas':
      return <MisTareasWidget />
    case 'comunicaciones':
      return <ComunicacionesWidget />
    default:
      return null
  }
}

export function MiDiaGrid({ nombre }: { nombre: string }) {
  const caps = useCapabilities()
  const attrs = useUserAttributes()

  const visible = WIDGET_REGISTRY
    .filter(w => shouldShowWidget(w, attrs, caps))
    .sort((a, b) => a.priority - b.priority)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visible.map(w => (
        <div key={w.id} className={SIZE_CLASS[w.size]}>
          {renderWidget(w.id, nombre)}
        </div>
      ))}
    </div>
  )
}
