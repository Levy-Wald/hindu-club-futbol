'use client'

import { VistasPanel } from '@/components/ui/vistas-panel'
import { TUTORES_MODULES, TUTORES_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'

export function TutoresVistas() {
  return (
    <VistasPanel
      modulo="tutores"
      modules={TUTORES_MODULES}
      defaultColumns={TUTORES_DEFAULT_COLUMNS}
      storageKey="tutores-columns"
    />
  )
}
