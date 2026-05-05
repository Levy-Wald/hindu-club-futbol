'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ExportFormat, ExportData, ClubBranding } from '@/lib/export/formats'

const CLUB_BRANDING: ClubBranding = {
  nombre: 'Hindu Club',
  direccion: 'Don Bosco 3569, Victoria, Buenos Aires',
  email: 'info@hinduclub.com.ar',
  web: 'www.hinduclub.com.ar',
  logoUrl: '/logo.png',
  usuario: '',
  fecha: '',
}

interface ExportFormatSelectorProps {
  getData: () => ExportData | null | Promise<ExportData | null>
  disabled?: boolean
  usuario?: string
}

export function ExportFormatSelector({ getData, disabled, usuario }: ExportFormatSelectorProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport(format: ExportFormat) {
    setLoading(true)
    try {
      const { exportData } = await import('@/lib/export/formats')
      const data = await getData()
      if (!data) { setLoading(false); return }

      const branding: ClubBranding = {
        ...CLUB_BRANDING,
        usuario: usuario || 'Admin',
        fecha: new Date().toLocaleDateString('es-AR'),
      }

      await exportData(format, data, branding)
      toast.success('Exportación completada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={disabled || loading} />}>
        {loading ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Download className="h-4 w-4 sm:mr-2" />}
        <span className="hidden sm:inline">Exportar</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          PDF simple
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf_membretado')}>
          <FileText className="h-4 w-4 mr-2" />
          PDF membretado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
