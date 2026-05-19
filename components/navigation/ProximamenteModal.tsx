'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Construction } from 'lucide-react'

interface ProximamenteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleName: string
}

export function ProximamenteModal({ open, onOpenChange, moduleName }: ProximamenteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>{moduleName}</DialogTitle>
          </div>
          <DialogDescription>
            Esta funcionalidad estará disponible próximamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
