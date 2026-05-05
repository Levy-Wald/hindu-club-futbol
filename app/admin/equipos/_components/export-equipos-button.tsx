'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

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
  function handleExport() {
    if (equipos.length === 0) {
      toast.error('No hay equipos para exportar')
      return
    }

    const headers = ['Nombre', 'Disciplina', 'Modalidad', 'Categoría', 'Activo', 'Miembros']
    const rows = equipos.map((e) => [
      e.nombre,
      e.disciplina_slug,
      e.modalidad ?? '',
      e.categoria_nombre,
      e.activo ? 'Sí' : 'No',
      String(e.miembros_count),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equipos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${equipos.length} equipos exportados`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Exportar</span>
    </Button>
  )
}
