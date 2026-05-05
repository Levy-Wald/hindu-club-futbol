'use client'

import { VistasPanel } from '@/components/ui/vistas-panel'
import { BAJAS_MODULES, BAJAS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'

export function BajasVistas() {
  return (
    <VistasPanel
      modulo="bajas"
      modules={BAJAS_MODULES}
      defaultColumns={BAJAS_DEFAULT_COLUMNS}
      storageKey="bajas-columns"
    />
  )
}
