'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, CheckCircle, Banknote, XCircle, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  aprobarLiquidacion,
  pagarLiquidacion,
  anularLiquidacion,
  eliminarLiquidacion,
} from '@/modules/rrhh/lib/actions'

interface Liquidacion {
  id: string
  estado: string
  movimiento_caja_id: string | null
}

interface Caja {
  id: string
  nombre: string
  tipo: string
  moneda: string
  saldo_actual: number | null
}

interface LiquidacionActionsProps {
  liquidacion: Liquidacion
  cajas: Caja[]
}

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

export function LiquidacionActions({ liquidacion, cajas }: LiquidacionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Pagar dialog
  const [pagarOpen, setPagarOpen] = useState(false)
  const [cajaSeleccionada, setCajaSeleccionada] = useState('')

  // Confirmations
  const [aprobarOpen, setAprobarOpen] = useState(false)
  const [anularOpen, setAnularOpen] = useState(false)
  const [eliminarOpen, setEliminarOpen] = useState(false)

  // Si esta anulada, no mostrar acciones
  if (liquidacion.estado === 'anulada') return null

  async function handleAprobar() {
    setLoading(true)
    const result = await aprobarLiquidacion(liquidacion.id)
    setLoading(false)
    setAprobarOpen(false)

    if (result.success) {
      toast.success('Liquidacion aprobada')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Error al aprobar')
    }
  }

  async function handlePagar() {
    if (!cajaSeleccionada) {
      toast.error('Selecciona una caja')
      return
    }

    setLoading(true)
    const result = await pagarLiquidacion(liquidacion.id, cajaSeleccionada)
    setLoading(false)
    setPagarOpen(false)
    setCajaSeleccionada('')

    if (result.success) {
      toast.success('Liquidacion pagada correctamente')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Error al pagar')
    }
  }

  async function handleAnular() {
    setLoading(true)
    const result = await anularLiquidacion(liquidacion.id)
    setLoading(false)
    setAnularOpen(false)

    if (result.success) {
      toast.success('Liquidacion anulada')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Error al anular')
    }
  }

  async function handleEliminar() {
    setLoading(true)
    const result = await eliminarLiquidacion(liquidacion.id)
    setLoading(false)
    setEliminarOpen(false)

    if (result.success) {
      toast.success('Liquidacion eliminada')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Error al eliminar')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {liquidacion.estado === 'borrador' && (
            <>
              <DropdownMenuItem onClick={() => setAprobarOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setEliminarOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
          {liquidacion.estado === 'aprobada' && (
            <>
              <DropdownMenuItem onClick={() => setPagarOpen(true)}>
                <Banknote className="h-4 w-4 mr-2" />
                Pagar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAnularOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Anular
              </DropdownMenuItem>
            </>
          )}
          {liquidacion.estado === 'pagada' && (
            <DropdownMenuItem
              onClick={() => setAnularOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Anular
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Aprobar confirmation */}
      <AlertDialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar liquidacion</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez aprobada, la liquidacion quedara lista para ser pagada. Esta accion no se puede deshacer directamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAprobar} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagar dialog */}
      <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar liquidacion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Caja de pago *</Label>
              <Select value={cajaSeleccionada} onValueChange={(v) => setCajaSeleccionada(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar caja..." />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({formatMoney(c.saldo_actual, c.moneda)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPagarOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handlePagar} disabled={loading || !cajaSeleccionada}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Confirmar pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Anular confirmation */}
      <AlertDialog open={anularOpen} onOpenChange={setAnularOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular liquidacion</AlertDialogTitle>
            <AlertDialogDescription>
              {liquidacion.movimiento_caja_id
                ? 'Esta liquidacion tiene un movimiento de caja asociado que tambien sera anulado. Esta accion no se puede deshacer.'
                : 'Esta accion marcara la liquidacion como anulada. No se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnular}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar confirmation */}
      <AlertDialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar liquidacion</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara esta liquidacion en borrador. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
