'use client'

import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import type { ExportData } from '@/lib/export/formats'

interface Equipo {
  id: string
  nombre: string
  disciplina_slug: string
  modalidad: string | null
  activo: boolean
  categoria_nombre: string
  miembros_count: number
}

interface ExportEquiposButtonProps {
  equipos: Equipo[]
}

export function ExportEquiposButton({ equipos }: ExportEquiposButtonProps) {
  function getData(): ExportData | null {
    if (equipos.length === 0) return null
    return {
      headers: ['Nombre', 'Disciplina', 'Modalidad', 'Categoría', 'Activo', 'Miembros'],
      rows: equipos.map((e) => [
        e.nombre,
        e.disciplina_slug,
        e.modalidad ?? '',
        e.categoria_nombre,
        e.activo ? 'Sí' : 'No',
        String(e.miembros_count),
      ]),
      filename: `equipos_${new Date().toISOString().split('T')[0]}`,
    }
  }

  return <ExportFormatSelector getData={getData} disabled={equipos.length === 0} />
}
