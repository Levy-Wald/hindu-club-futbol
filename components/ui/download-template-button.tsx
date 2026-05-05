'use client'

import { Button } from '@/components/ui/button'
import { FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadTemplateButtonProps {
  headers: string[]
  filename: string
  sampleRow?: string[]
}

export function DownloadTemplateButton({ headers, filename, sampleRow }: DownloadTemplateButtonProps) {
  function handleDownload() {
    const rows = [headers.join(',')]
    if (sampleRow) {
      rows.push(sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
    }
    const csv = rows.join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Modelo descargado')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Modelo</span>
    </Button>
  )
}
