'use client'

import type { RolEnEquipo } from '../lib/types'

export function LabelRol({ rol }: { rol: RolEnEquipo }) {
  if (rol.es_capitan) {
    return (
      <span className="inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-800">
        C
      </span>
    )
  }
  if (rol.es_subcapitan) {
    return (
      <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
        SC
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
      {rol.rol_nombre}
    </span>
  )
}
