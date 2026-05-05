'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { downloadTemplateCSV, downloadTemplateXLSX } from '@/lib/export/template'

interface DownloadTemplateButtonProps {
  headers: string[]
  filename: string
  sampleRow?: string[]
}

export function DownloadTemplateButton({ headers, filename, sampleRow }: DownloadTemplateButtonProps) {
  function handleCSV() {
    downloadTemplateCSV(headers, filename, sampleRow)
    toast.success('Modelo CSV descargado')
  }

  function handleXLSX() {
    downloadTemplateXLSX(headers, filename, sampleRow)
    toast.success('Modelo XLSX descargado')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Modelo</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Descargar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleXLSX}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Descargar Excel (XLSX)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
