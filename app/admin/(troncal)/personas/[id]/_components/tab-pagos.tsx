'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Loader2,
  Ban,
  CreditCard,
} from 'lucide-react'
import {
  fetchPagosPorPersona,
  anularPago,
} from '@/app/admin/(troncal)/finanzas/cuotas/_actions'

interface Pago {
  id: string
  monto_pagado: number
  moneda: string
  fecha_pago: string
  estado: string
  comprobante_numero: string | null
  observaciones: string | null
  anulado_motivo: string | null
  anulado_at: string | null
  created_at: string
  medios_pago: { nombre: string }[]
  cajas: { nombre: string }[]
  cuotas_emitidas: {
    persona_id: string
    periodo: string
    plan_id: string
    cuotas_planes: { nombre: string }[]
  }[]
}

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function estadoPagoBadge(estado: string) {
  switch (estado) {
    case 'confirmado':
      return <Badge variant="secondary" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Confirmado</Badge>
    case 'anulado':
      return <Badge variant="secondary" className="bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400">Anulado</Badge>
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

export function TabPagos({ personaId }: { personaId: string }) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [anularDialog, setAnularDialog] = useState<Pago | null>(null)
  const [anularMotivo, setAnularMotivo] = useState('')

  async function loadPagos() {
    const data = await fetchPagosPorPersona(personaId, {
      estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
    })
    setPagos(data as unknown as Pago[])
    setLoading(false)
  }

  useEffect(() => {
    loadPagos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId, filtroEstado])

  function handleAnular(pago: Pago) {
    setAnularDialog(pago)
    setAnularMotivo('')
  }

  function handleConfirmAnular() {
    if (!anularDialog) return
    if (!anularMotivo.trim()) {
      toast.error('Ingresa el motivo de anulación')
      return
    }

    startTransition(async () => {
      const result = await anularPago(anularDialog.id, anularMotivo.trim())
      if (result.ok) {
        toast.success(result.message)
        setAnularDialog(null)
        loadPagos()
      } else {
        toast.error(result.message)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val ?? 'todos')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="anulado">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pagos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No hay pagos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead>Caja</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => {
                const cuota = p.cuotas_emitidas?.[0]
                const plan = cuota?.cuotas_planes?.[0]
                const medio = p.medios_pago?.[0]
                const caja = p.cajas?.[0]
                return (
                  <TableRow key={p.id} className={p.estado === 'anulado' ? 'opacity-50' : ''}>
                    <TableCell className="text-sm">
                      {new Date(p.fecha_pago + 'T00:00:00').toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{plan?.nombre ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{cuota?.periodo ?? '-'}</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatMoney(p.monto_pagado, p.moneda)}
                    </TableCell>
                    <TableCell className="text-sm">{medio?.nombre ?? '-'}</TableCell>
                    <TableCell className="text-sm">{caja?.nombre ?? '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.comprobante_numero ?? '-'}
                    </TableCell>
                    <TableCell>{estadoPagoBadge(p.estado)}</TableCell>
                    <TableCell>
                      {p.estado === 'confirmado' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          onClick={() => handleAnular(p)}
                          title="Anular pago"
                        >
                          <Ban className="h-4 w-4 text-error-600 dark:text-error-400" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Anular Pago */}
      <Dialog
        open={!!anularDialog}
        onOpenChange={(open) => {
          if (!open) setAnularDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription>
              Esta acción creará un movimiento de reversión. El pago quedará marcado como anulado.
            </DialogDescription>
          </DialogHeader>

          {anularDialog && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-mono font-medium">{formatMoney(anularDialog.monto_pagado, anularDialog.moneda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{new Date(anularDialog.fecha_pago + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                </div>
                {anularDialog.comprobante_numero && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comprobante:</span>
                    <span className="font-medium">{anularDialog.comprobante_numero}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Motivo de anulación *</Label>
                <Textarea
                  value={anularMotivo}
                  onChange={(e) => setAnularMotivo(e.target.value)}
                  placeholder="Indicar motivo..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAnularDialog(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAnular}
              disabled={isPending || !anularMotivo.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Anular pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
