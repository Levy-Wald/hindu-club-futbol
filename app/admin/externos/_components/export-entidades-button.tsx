'use client'

import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import type { ExportData } from '@/lib/export/formats'

interface Entidad {
  id: string
  nombre: string
  tipo: string
  telefono: string | null
  email: string | null
  sitio_web: string | null
  cuit: string | null
  activo: boolean
}

interface ExportEntidadesButtonProps {
  entidades: Entidad[]
}

export function ExportEntidadesButton({ entidades }: ExportEntidadesButtonProps) {
  function getData(): ExportData | null {
    if (entidades.length === 0) return null
    return {
      headers: ['Nombre', 'Tipo', 'Teléfono', 'Email', 'Sitio web', 'CUIT', 'Activo'],
      rows: entidades.map((e) => [
        e.nombre,
        e.tipo,
        e.telefono ?? '',
        e.email ?? '',
        e.sitio_web ?? '',
        e.cuit ?? '',
        e.activo ? 'Sí' : 'No',
      ]),
      filename: `entidades_externas_${new Date().toISOString().split('T')[0]}`,
    }
  }

  return <ExportFormatSelector getData={getData} disabled={entidades.length === 0} />
}
