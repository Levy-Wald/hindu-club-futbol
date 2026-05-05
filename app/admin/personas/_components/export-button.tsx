'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { ExportPersonasDialog } from './export-personas-dialog'

export function ExportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>
      <ExportPersonasDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
