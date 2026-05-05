'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ImportDialog } from './import-dialog'

export function ImportButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-3.5 w-3.5" />
        Importar CSV
      </Button>
      <ImportDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
