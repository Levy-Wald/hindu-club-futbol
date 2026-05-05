'use client'

import { VistasPanel } from '@/components/ui/vistas-panel'
import { PERSONAS_MODULES, PERSONAS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'

export function PersonasVistas() {
  return (
    <VistasPanel
      modulo="personas"
      modules={PERSONAS_MODULES}
      defaultColumns={PERSONAS_DEFAULT_COLUMNS}
      storageKey="personas-columns"
    />
  )
}
