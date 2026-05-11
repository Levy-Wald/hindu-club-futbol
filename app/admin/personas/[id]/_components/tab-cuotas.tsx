'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Loader2,
  MoreHorizontal,
  DollarSign,
  Ban,
  Receipt,
} from 'lucide-react'
import {
  fetchCuotasCompletas,
  fetchCuentaCorrientePersona,
  cobrarCuota,
  anularCuota,
  fetchSaldoCuota,
} from '@/app/admin/finanzas/cuotas/_actions'
import { createClient } from '@/lib/supabase/client'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface CuotaView {
  id: string
  plan_nombre: string
  periodo: string
  monto_original: number
  monto_final: number
  moneda: string
  estado: string
  fecha_vencimiento: string
  fecha_pago: string | null
  dias_vencida: number
}

interface CuentaCorriente {
  cuotas_pendientes: number
  cuotas_vencidas: number
  saldo_deudor: number
  pagado_ultimos_30d: number
  ultimo_pago_fecha: string | null
}

interface TipoComprobante {
  id: string
  nombre: string
  slug: string
}

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function estadoBadge(estado: string) {
  switch (estado) {
    case 'pendiente':
      return <Badge variant="secondary" className="bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400">Pendiente</Badge>
    case 'vencida':
      return <Badge variant="secondary" className="bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400">Vencida</Badge>
    case 'pagada':
      return <Badge variant="secondary" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Pagada</Badge>
    case 'parcial':
      return <Badge variant="secondary" className="bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400">Parcial</Badge>
    case 'anulada':
      return <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400">Anulada</Badge>
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

export function TabCuotas({ personaId }: { personaId: string }) {
  const [cuotas, setCuotas] = useState<CuotaView[]>([])
  const [cc, setCc] = useState<CuentaCorriente | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [cobrarDialog, setCobrarDialog] = useState<CuotaView | null>(null)
  const [cobrarCajaId, setCobrarCajaId] = useState('')
  const [cobrarMedioPagoId, setCobrarMedioPagoId] = useState('')
  const [cobrarMonto, setCobrarMonto] = useState('')
  const [cobrarSaldoPendiente, setCobrarSaldoPendiente] = useState(0)
  const [cobrarFechaPago, setCobrarFechaPago] = useState('')
  const [cobrarGenerarComprobante, setCobrarGenerarComprobante] = useState(true)
  const [cobrarTipoComprobanteId, setCobrarTipoComprobanteId] = useState('')
  const [cobrarObservaciones, setCobrarObservaciones] = useState('')
  const [cajas, setCajas] = useState<{ id: string; nombre: string }[]>([])
  const [mediosPago, setMediosPago] = useState<{ id: string; nombre: string }[]>([])
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobante[]>([])

  async function loadData() {
    const [cuotasData, ccData] = await Promise.all([
      fetchCuotasCompletas({ persona_id: personaId }),
      fetchCuentaCorrientePersona(personaId),
    ])

    setCuotas(cuotasData.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      plan_nombre: (c.plan_nombre as string) || '-',
      periodo: c.periodo as string,
      monto_original: c.monto_original as number,
      monto_final: c.monto_final as number,
      moneda: (c.moneda as string) || 'ARS',
      estado: c.estado as string,
      fecha_vencimiento: c.fecha_vencimiento as string,
      fecha_pago: c.fecha_pago as string | null,
      dias_vencida: (c.dias_vencida as number) || 0,
    })))

    if (ccData.length > 0) {
      setCc(ccData[0] as unknown as CuentaCorriente)
    }

    setLoading(false)
  }

  async function loadCajasYMedios() {
    const supabase = createClient()
    const [cajasRes, mediosRes, tiposRes] = await Promise.all([
      supabase.from('cajas').select('id, nombre').eq('tenant_id', TENANT_ID).eq('activa', true).order('nombre'),
      supabase.from('medios_pago').select('id, nombre').eq('tenant_id', TENANT_ID).eq('activo', true).order('nombre'),
      supabase.from('tipos_comprobante').select('id, nombre, slug').eq('tenant_id', TENANT_ID).eq('activo', true).order('orden'),
    ])
    if (cajasRes.data) setCajas(cajasRes.data)
    if (mediosRes.data) setMediosPago(mediosRes.data)
    if (tiposRes.data) {
      const tipos = tiposRes.data as TipoComprobante[]
      setTiposComprobante(tipos)
      const reciboX = tipos.find(t => t.slug === 'recibo_x')
      if (reciboX) setCobrarTipoComprobanteId(reciboX.id)
    }
  }

  useEffect(() => {
    loadData()
    loadCajasYMedios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId])

  async function handleCobrar(cuota: CuotaView) {
    setCobrarDialog(cuota)
    setCobrarCajaId('')
    setCobrarMedioPagoId('')
    setCobrarFechaPago(new Date().toISOString().split('T')[0])
    setCobrarGenerarComprobante(true)
    setCobrarObservaciones('')
    const reciboX = tiposComprobante.find(t => t.slug === 'recibo_x')
    setCobrarTipoComprobanteId(reciboX?.id ?? '')
    const saldo = await fetchSaldoCuota(cuota.id)
    setCobrarSaldoPendiente(saldo.saldo_pendiente)
    setCobrarMonto(String(saldo.saldo_pendiente))
  }

  function handleConfirmCobrar() {
    if (!cobrarDialog) return
    const monto = Number(cobrarMonto)
    if (!monto || monto <= 0) { toast.error('El monto debe ser mayor a 0'); return }
    if (monto > cobrarSaldoPendiente) { toast.error('El monto no puede superar el saldo pendiente'); return }
    if (!cobrarCajaId) { toast.error('Selecciona una caja'); return }
    if (!cobrarMedioPagoId) { toast.error('Selecciona un medio de pago'); return }

    startTransition(async () => {
      const result = await cobrarCuota(cobrarDialog.id, monto, cobrarCajaId, cobrarMedioPagoId, {
        fechaPago: cobrarFechaPago || undefined,
        tipoComprobanteId: cobrarGenerarComprobante ? cobrarTipoComprobanteId || undefined : undefined,
        observaciones: cobrarObservaciones.trim() || undefined,
      })
      if (result.ok) {
        toast.success(result.message)
        setCobrarDialog(null)
        loadData()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleAnular(cuotaId: string) {
    startTransition(async () => {
      const result = await anularCuota(cuotaId)
      if (result.ok) {
        toast.success(result.message)
        loadData()
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
      {/* Cuenta corriente resumen */}
      {cc && (cc.cuotas_pendientes > 0 || cc.cuotas_vencidas > 0 || cc.saldo_deudor > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-xl font-bold">{cc.cuotas_pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <p className="text-xl font-bold text-error-600 dark:text-error-400">{cc.cuotas_vencidas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Saldo deudor</p>
              <p className="text-xl font-bold font-mono">{formatMoney(cc.saldo_deudor)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Ultimo pago</p>
              <p className="text-sm font-medium">
                {cc.ultimo_pago_fecha
                  ? new Date(cc.ultimo_pago_fecha + 'T00:00:00').toLocaleDateString('es-AR')
                  : 'Sin pagos'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {cuotas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No hay cuotas emitidas para esta persona</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuotas.map((c) => {
                const esCobrable = c.estado === 'pendiente' || c.estado === 'vencida' || c.estado === 'parcial'
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.plan_nombre}</TableCell>
                    <TableCell className="text-sm">{c.periodo}</TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatMoney(c.monto_final, c.moneda)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                      {c.dias_vencida > 0 && (
                        <span className="ml-1 text-error-600 dark:text-error-400 text-xs">
                          ({c.dias_vencida}d)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{estadoBadge(c.estado)}</TableCell>
                    <TableCell>
                      {esCobrable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" disabled={isPending} />}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCobrar(c)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Cobrar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleAnular(c.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Anular
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Cobrar */}
      <Dialog
        open={!!cobrarDialog}
        onOpenChange={(open) => {
          if (!open) setCobrarDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar cuota</DialogTitle>
            <DialogDescription>
              Registra el cobro de la cuota seleccionada.
            </DialogDescription>
          </DialogHeader>

          {cobrarDialog && (
            <div className="space-y-4">
              {/* Resumen cuota */}
              <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{cobrarDialog.plan_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periodo:</span>
                  <span className="font-medium">{cobrarDialog.periodo}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total cuota:</span>
                  <span className="font-mono">{formatMoney(cobrarDialog.monto_final, cobrarDialog.moneda)}</span>
                </div>
                {cobrarSaldoPendiente < cobrarDialog.monto_final && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo pendiente:</span>
                    <span className="font-mono font-bold text-info-600 dark:text-info-400">
                      {formatMoney(cobrarSaldoPendiente, cobrarDialog.moneda)}
                    </span>
                  </div>
                )}
              </div>

              {/* Monto a cobrar */}
              <div className="space-y-2">
                <Label>Monto a cobrar *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={cobrarSaldoPendiente}
                  value={cobrarMonto}
                  onChange={(e) => setCobrarMonto(e.target.value)}
                  className="font-mono"
                />
                {cobrarSaldoPendiente > 0 && Number(cobrarMonto) < cobrarSaldoPendiente && Number(cobrarMonto) > 0 && (
                  <p className="text-xs text-info-600 dark:text-info-400">
                    Pago parcial — quedará un saldo de {formatMoney(cobrarSaldoPendiente - Number(cobrarMonto), cobrarDialog.moneda)}
                  </p>
                )}
              </div>

              {/* Caja y medio de pago */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Caja *</Label>
                  <Select value={cobrarCajaId} onValueChange={(val) => setCobrarCajaId(val ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cajas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medio de pago *</Label>
                  <Select value={cobrarMedioPagoId} onValueChange={(val) => setCobrarMedioPagoId(val ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediosPago.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha de pago */}
              <div className="space-y-2">
                <Label>Fecha de pago</Label>
                <Input
                  type="date"
                  value={cobrarFechaPago}
                  onChange={(e) => setCobrarFechaPago(e.target.value)}
                />
              </div>

              {/* Comprobante */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="generar-comprobante-persona"
                    checked={cobrarGenerarComprobante}
                    onCheckedChange={(checked) => setCobrarGenerarComprobante(checked === true)}
                  />
                  <Label htmlFor="generar-comprobante-persona" className="cursor-pointer">Generar comprobante</Label>
                </div>
                {cobrarGenerarComprobante && (
                  <Select value={cobrarTipoComprobanteId} onValueChange={(val) => setCobrarTipoComprobanteId(val ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de comprobante" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposComprobante.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>{tc.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={cobrarObservaciones}
                  onChange={(e) => setCobrarObservaciones(e.target.value)}
                  placeholder="Opcional"
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCobrarDialog(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCobrar}
              disabled={isPending || !cobrarCajaId || !cobrarMedioPagoId || !cobrarMonto || Number(cobrarMonto) <= 0}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <DollarSign className="h-4 w-4 mr-1" />
              Registrar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
