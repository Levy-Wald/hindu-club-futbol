'use client'

import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import type { ExportData } from '@/lib/export/formats'

interface Miembro {
  id: string
  persona_id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email: string | null
  numero_socio: string | null
  tipo_socio: string | null
  estado_padron: string | null
  fecha_alta: string | null
}

interface ExportPadronButtonProps {
  padronNombre: string
  miembros: Miembro[]
}

export function ExportPadronButton({ padronNombre, miembros }: ExportPadronButtonProps) {
  function getData(): ExportData | null {
    if (miembros.length === 0) return null
    return {
      headers: ['Apellido', 'Nombre', 'Documento', 'Email', 'N. Socio', 'Tipo Socio', 'Estado', 'Fecha Alta'],
      rows: miembros.map((m) => [
        m.apellido,
        m.nombre,
        m.numero_documento ?? '',
        m.email ?? '',
        m.numero_socio ?? '',
        m.tipo_socio ?? '',
        m.estado_padron ?? '',
        m.fecha_alta ?? '',
      ]),
      filename: `padron_${padronNombre.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    }
  }

  return <ExportFormatSelector getData={getData} disabled={miembros.length === 0} />
}
