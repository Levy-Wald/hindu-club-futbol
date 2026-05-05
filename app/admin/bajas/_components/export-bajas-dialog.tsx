'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportarBajas } from '../_actions-export'
import type { ExportFormat, ExportData, ClubBranding } from '@/lib/export/formats'

const FIELDS = [
  { key: 'apellido', label: 'Apellido' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'numero_documento', label: 'Documento' },
  { key: 'email_principal', label: 'Email' },
  { key: 'telefono_principal', label: 'Teléfono' },
  { key: 'motivo_baja_slug', label: 'Motivo de baja' },
  { key: 'motivo_baja_detalle', label: 'Detalle' },
  { key: 'fecha_baja', label: 'Fecha de baja' },
]

const ALL_FIELD_KEYS = FIELDS.map((f) => f.key)

function buildFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `bajas_export_${date}`
}

export function ExportBajasDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_FIELD_KEYS))

  function toggleField(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(ALL_FIELD_KEYS))
  }

  function selectNone() {
    setSelected(new Set())
  }

  function buildParams() {
    const q = searchParams.get('q') ?? undefined
    const motivosRaw = searchParams.get('motivos')
    const fechaDesde = searchParams.get('fecha_desde') ?? undefined
    const fechaHasta = searchParams.get('fecha_hasta') ?? undefined

    return {
      campos: Array.from(selected),
      filtros: {
        search: q,
        motivos: motivosRaw ? motivosRaw.split(',').filter(Boolean) : undefined,
        fechaDesde,
        fechaHasta,
      },
    }
  }

  async function handleExport(format: ExportFormat) {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const { exportData } = await import('@/lib/export/formats')
      const result = await exportarBajas(buildParams())
      if (!result.ok) {
        toast.error('Error al exportar bajas. Intenta de nuevo.')
        return
      }

      const fields = FIELDS.filter((f) => selected.has(f.key))
      const headers = fields.map((f) => f.label)
      const rows = result.data.map((row) =>
        fields.map((f) => String(row[f.key] ?? ''))
      )

      const data: ExportData = { headers, rows, filename: buildFilename() }
      const branding: ClubBranding = {
        nombre: 'Hindu Club',
        direccion: 'Don Bosco 3569, Victoria, Buenos Aires',
        email: 'info@hinduclub.com.ar',
        web: 'www.hinduclub.com.ar',
        logoUrl: '/logo.png',
        usuario: 'Admin',
        fecha: new Date().toLocaleDateString('es-AR'),
      }

      await exportData(format, data, branding)
      toast.success(`${result.data.length} baja${result.data.length !== 1 ? 's' : ''} exportada${result.data.length !== 1 ? 's' : ''} correctamente.`)
      onOpenChange(false)
    } catch {
      toast.error('Error inesperado al exportar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar bajas</DialogTitle>
          <DialogDescription>
            Exportar todas las bajas segun los filtros actuales
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll} disabled={loading}>
            Seleccionar todo
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone} disabled={loading}>
            Deseleccionar todo
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {selected.size} de {FIELDS.length} campos
          </span>
        </div>

        <div className="space-y-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selected.has(f.key)}
                onCheckedChange={() => toggleField(f.key)}
                disabled={loading}
              />
              {f.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t mt-4">
          <Button
            onClick={() => handleExport('csv')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />}
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf_membretado')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            Membretado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
