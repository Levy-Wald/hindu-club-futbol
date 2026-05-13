'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { EspacioConSede } from '../lib/tipos'

interface EspacioRowProps {
  espacio: EspacioConSede
  onEdit: (espacio: EspacioConSede) => void
  onDelete: (id: string) => void
}

export function EspacioRow({ espacio, onEdit, onDelete }: EspacioRowProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{espacio.nombre}</span>
          {!espacio.activo && <Badge variant="secondary">Inactivo</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{espacio.sede_nombre}</span>
          <span>·</span>
          <span>{espacio.tipo_slug.replace(/_/g, ' ')}</span>
          {espacio.capacidad_personas && (
            <>
              <span>·</span>
              <span>{espacio.capacidad_personas} personas</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(espacio)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(espacio.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
