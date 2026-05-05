'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface Entidad {
  id: string
  nombre: string
  tipo: string
  telefono: string | null
  email: string | null
  activo: boolean
}

interface ExportEntidadesButtonProps {
  entidades: Entidad[]
}

export function ExportEntidadesButton({ entidades }: ExportEntidadesButtonProps) {
  function handleExport() {
    if (entidades.length === 0) {
      toast.error('No hay entidades para exportar')
      return
    }

    const headers = ['Nombre', 'Tipo', 'Teléfono', 'Email', 'Activo']
    const rows = entidades.map((e) => [
      e.nombre,
      e.tipo,
      e.telefono ?? '',
      e.email ?? '',
      e.activo ? 'Sí' : 'No',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entidades_externas_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${entidades.length} entidades exportadas`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Exportar</span>
    </Button>
  )
}
