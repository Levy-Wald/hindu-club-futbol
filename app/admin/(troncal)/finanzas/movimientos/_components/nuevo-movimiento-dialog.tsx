'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { MovimientoForm } from './movimiento-form'

interface Caja {
  id: string
  nombre: string
  tipo: string
  activa: boolean
}

interface Categoria {
  id: string
  nombre: string
  tipo: string
}

interface MedioPago {
  id: string
  nombre: string
}

interface CentroCosto {
  id: string
  nombre: string
}

interface NuevoMovimientoDialogProps {
  cajas: Caja[]
  categorias: Categoria[]
  mediosPago: MedioPago[]
  centrosCosto: CentroCosto[]
  cajaPreseleccionada?: string
}

export function NuevoMovimientoDialog({
  cajas,
  categorias,
  mediosPago,
  centrosCosto,
  cajaPreseleccionada,
}: NuevoMovimientoDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nuevo movimiento
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>
        <MovimientoForm
          cajas={cajas}
          categorias={categorias}
          mediosPago={mediosPago}
          centrosCosto={centrosCosto}
          cajaPreseleccionada={cajaPreseleccionada}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
