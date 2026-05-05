'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

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
  function handleExport() {
    if (miembros.length === 0) {
      toast.error('No hay miembros para exportar')
      return
    }

    const headers = ['Apellido', 'Nombre', 'Documento', 'Email', 'N. Socio', 'Tipo Socio', 'Estado', 'Fecha Alta']
    const rows = miembros.map((m) => [
      m.apellido,
      m.nombre,
      m.numero_documento ?? '',
      m.email ?? '',
      m.numero_socio ?? '',
      m.tipo_socio ?? '',
      m.estado_padron ?? '',
      m.fecha_alta ?? '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fecha = new Date().toISOString().split('T')[0]
    a.download = `padron_${padronNombre.toLowerCase().replace(/\s+/g, '_')}_${fecha}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${miembros.length} miembros exportados`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Exportar</span>
    </Button>
  )
}
