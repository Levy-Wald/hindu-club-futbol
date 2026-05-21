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

interface Producto {
  id: string
  nombre: string
  sku: string | null
  tipo_uso: string | null
}

interface CuentaContable {
  id: string
  codigo: string
  nombre: string
}

interface NuevoMovimientoDialogProps {
  cajas: Caja[]
  categorias: Categoria[]
  mediosPago: MedioPago[]
  centrosCosto: CentroCosto[]
  productos: Producto[]
  cuentas: CuentaContable[]
  cajaPreseleccionada?: string
  tipoInicial?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NuevoMovimientoDialog({
  cajas,
  categorias,
  mediosPago,
  centrosCosto,
  productos,
  cuentas,
  cajaPreseleccionada,
  tipoInicial,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NuevoMovimientoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const tipoLabels: Record<string, string> = {
    ingreso: 'Nuevo ingreso',
    egreso: 'Nuevo egreso',
    transferencia: 'Nueva transferencia',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOnOpenChange && (
        trigger ? (
          <DialogTrigger render={trigger as React.ReactElement} />
        ) : (
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo movimiento
          </DialogTrigger>
        )
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tipoInicial ? tipoLabels[tipoInicial] ?? 'Nuevo movimiento' : 'Nuevo movimiento'}</DialogTitle>
        </DialogHeader>
        <MovimientoForm
          cajas={cajas}
          categorias={categorias}
          mediosPago={mediosPago}
          centrosCosto={centrosCosto}
          productos={productos}
          cuentas={cuentas}
          cajaPreseleccionada={cajaPreseleccionada}
          tipoInicial={tipoInicial}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
