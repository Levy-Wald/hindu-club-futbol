'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { ExportTutoresDialog } from './export-tutores-dialog'

export function TutoresExportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>
      <ExportTutoresDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
