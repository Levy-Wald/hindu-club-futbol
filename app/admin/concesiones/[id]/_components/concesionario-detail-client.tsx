'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Store, MapPin, ShoppingBag, TrendingUp, Plus, Calculator,
  DollarSign, CreditCard, ArrowLeft, XCircle,
} from 'lucide-react'
import {
  crearPuntoVenta, crearProducto, ajustarStock,
  calcularCanonPeriodo, cobrarCanon, anularVenta, editarConcesionario,
} from '../../_actions'

/* eslint-disable @typescript-eslint/no-explicit-any */

const CATEGORIAS_PRODUCTO = [
  'bebida', 'comida', 'snack', 'fruta', 'higiene',
  'indumentaria', 'accesorio', 'cigarrillos', 'otro',
]

interface Props {
  concesionario: any
  puntosVenta: any[]
  productos: any[]
  ventas: any[]
  canones: any[]
  reporteMensual: any[]
  sedes: Array<{ id: string; nombre: string }>
}

export function ConcesionarioDetailClient({
  concesionario, puntosVenta, productos, ventas, canones, reporteMensual, sedes,
}: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/concesiones">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            {concesionario.nombre_comercial}
          </h1>
          <p className="text-sm text-muted-foreground">
            Titular: {concesionario.titular ?? '—'} · Canon: {concesionario.canon_porcentaje}%
            · MP: {concesionario.mp_modo}
          </p>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="pdv">Puntos de Venta</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="canon">Canon</TabsTrigger>
          <TabsTrigger value="mp">MercadoPago</TabsTrigger>
        </TabsList>

        {/* === RESUMEN === */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={MapPin} label="Puntos de venta" value={concesionario.cant_puntos_venta} />
            <StatCard icon={ShoppingBag} label="Productos activos" value={concesionario.cant_productos} />
            <StatCard icon={TrendingUp} label="Ventas este mes" value={concesionario.ventas_mes_actual} />
            <StatCard icon={DollarSign} label="Canon acum. mes" value={`$${Number(concesionario.canon_acumulado_mes_actual).toLocaleString('es-AR')}`} />
          </div>

          {reporteMensual.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Historial mensual</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="py-2 pr-4">Período</th>
                        <th className="py-2 pr-4 text-right">Ventas</th>
                        <th className="py-2 pr-4 text-right">Total bruto</th>
                        <th className="py-2 pr-4 text-right">Canon</th>
                        <th className="py-2 text-right">Ticket prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteMensual.map((r: any) => (
                        <tr key={r.periodo} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{r.periodo}</td>
                          <td className="py-2 pr-4 text-right">{r.cantidad_ventas}</td>
                          <td className="py-2 pr-4 text-right">${Number(r.total_bruto).toLocaleString('es-AR')}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-primary">${Number(r.total_canon).toLocaleString('es-AR')}</td>
                          <td className="py-2 text-right">${Number(r.ticket_promedio).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === PUNTOS DE VENTA === */}
        <TabsContent value="pdv" className="space-y-4">
          <PuntosVentaTab
            concesionarioId={concesionario.id}
            puntosVenta={puntosVenta}
            sedes={sedes}
          />
        </TabsContent>

        {/* === PRODUCTOS === */}
        <TabsContent value="productos" className="space-y-4">
          <ProductosTab concesionarioId={concesionario.id} productos={productos} />
        </TabsContent>

        {/* === VENTAS === */}
        <TabsContent value="ventas" className="space-y-4">
          <VentasTab
            concesionarioId={concesionario.id}
            ventas={ventas}
            puntosVenta={puntosVenta}
          />
        </TabsContent>

        {/* === CANON === */}
        <TabsContent value="canon" className="space-y-4">
          <CanonTab concesionarioId={concesionario.id} canones={canones} />
        </TabsContent>

        {/* === MERCADOPAGO === */}
        <TabsContent value="mp" className="space-y-4">
          <MPTab concesionario={concesionario} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Stat Card ---
function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Puntos de Venta Tab ---
function PuntosVentaTab({ concesionarioId, puntosVenta, sedes }: {
  concesionarioId: string; puntosVenta: any[]; sedes: Array<{ id: string; nombre: string }>
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ nombre: '', sede_id: '', ubicacion_detalle: '', descripcion: '' })

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{puntosVenta.length} punto(s) de venta</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo PDV
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo punto de venta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Kiosko vestuario" />
              </div>
              <div>
                <Label>Sede</Label>
                <Select value={form.sede_id} onValueChange={v => setForm(f => ({ ...f, sede_id: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                  <SelectContent>
                    {sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ubicación detalle</Label>
                <Input value={form.ubicacion_detalle} onChange={e => setForm(f => ({ ...f, ubicacion_detalle: e.target.value }))} placeholder="Junto al vestuario" />
              </div>
              <Button className="w-full" disabled={isPending} onClick={() => {
                startTransition(async () => {
                  const res = await crearPuntoVenta(concesionarioId, form)
                  if (res.ok) { setOpen(false); setForm({ nombre: '', sede_id: '', ubicacion_detalle: '', descripcion: '' }) }
                })
              }}>
                {isPending ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {puntosVenta.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay puntos de venta. Creá uno para empezar.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {puntosVenta.map((pdv: any) => (
            <Card key={pdv.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{pdv.nombre}</p>
                    <p className="text-sm text-muted-foreground">{pdv.ubicacion_detalle ?? '—'}</p>
                    {pdv.sedes && <p className="text-xs text-muted-foreground mt-1">Sede: {(pdv.sedes as any).nombre}</p>}
                  </div>
                  <Link href={`/admin/concesiones/${concesionarioId}/punto-venta/${pdv.id}/vender`}>
                    <Button size="sm" variant="outline"><ShoppingBag className="h-3.5 w-3.5 mr-1" /> Vender</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

// --- Productos Tab ---
function ProductosTab({ concesionarioId, productos }: { concesionarioId: string; productos: any[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ nombre: '', categoria: 'bebida', precio: 0, stock_actual: 0, stock_minimo: 0, marca: '' })

  const activos = productos.filter(p => p.activo)
  const bajoStock = activos.filter(p => p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo)

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{activos.length} producto(s)</h2>
          {bajoStock.length > 0 && <p className="text-sm text-warning">{bajoStock.length} con stock bajo</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo producto
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v ?? 'bebida' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PRODUCTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Precio</Label><Input type="number" min={0} value={form.precio} onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))} /></div>
                <div><Label>Stock</Label><Input type="number" min={0} value={form.stock_actual} onChange={e => setForm(f => ({ ...f, stock_actual: Number(e.target.value) }))} /></div>
                <div><Label>Mín.</Label><Input type="number" min={0} value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: Number(e.target.value) }))} /></div>
              </div>
              <Button className="w-full" disabled={isPending} onClick={() => {
                startTransition(async () => {
                  const res = await crearProducto(concesionarioId, form)
                  if (res.ok) { setOpen(false); setForm({ nombre: '', categoria: 'bebida', precio: 0, stock_actual: 0, stock_minimo: 0, marca: '' }) }
                })
              }}>
                {isPending ? 'Creando...' : 'Crear producto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay productos cargados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4 text-right">Precio</th>
                <th className="py-2 pr-4 text-right">Stock</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <span className="font-medium">{p.nombre}</span>
                    {p.marca && <span className="text-muted-foreground ml-1 text-xs">({p.marca})</span>}
                  </td>
                  <td className="py-2 pr-4"><Badge variant="secondary">{p.categoria}</Badge></td>
                  <td className="py-2 pr-4 text-right">${Number(p.precio).toLocaleString('es-AR')}</td>
                  <td className="py-2 pr-4 text-right">
                    <span className={p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo ? 'text-destructive font-medium' : ''}>
                      {p.stock_actual}
                    </span>
                    {p.stock_minimo > 0 && <span className="text-muted-foreground text-xs"> (mín: {p.stock_minimo})</span>}
                  </td>
                  <td className="py-2">
                    <StockAdjustButton productId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function StockAdjustButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState(0)
  const [motivo, setMotivo] = useState('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        Ajustar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajustar stock</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Cantidad (+/-)</Label><Input type="number" value={delta} onChange={e => setDelta(Number(e.target.value))} /></div>
          <div><Label>Motivo</Label><Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Reposición, merma, etc." /></div>
          <Button className="w-full" disabled={isPending || delta === 0} onClick={() => {
            startTransition(async () => {
              await ajustarStock(productId, delta, motivo)
              setOpen(false); setDelta(0); setMotivo('')
            })
          }}>
            {isPending ? 'Ajustando...' : 'Confirmar ajuste'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// --- Ventas Tab ---
function VentasTab({ concesionarioId, ventas, puntosVenta }: {
  concesionarioId: string; ventas: any[]; puntosVenta: any[]
}) {
  const [isPending, startTransition] = useTransition()

  const estadoColor: Record<string, string> = {
    confirmada: 'bg-green-100 text-green-700',
    pendiente_pago: 'bg-yellow-100 text-yellow-700',
    anulada: 'bg-red-100 text-red-700',
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{ventas.length} venta(s)</h2>
        {puntosVenta.length > 0 && (
          <Link href={`/admin/concesiones/${concesionarioId}/punto-venta/${puntosVenta[0].id}/vender`}>
            <Button size="sm"><ShoppingBag className="h-4 w-4 mr-1" /> Registrar venta</Button>
          </Link>
        )}
      </div>

      {ventas.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay ventas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Comprador</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2 pr-4 text-right">Canon</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v: any) => {
                const comprador = v.comprador
                  ? `${(v.comprador as any).nombre} ${(v.comprador as any).apellido}`
                  : (v.comprador_nombre_libre || 'Anónimo')
                return (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(v.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="py-2 pr-4">{comprador}</td>
                    <td className="py-2 pr-4">{v.metodo_pago}</td>
                    <td className="py-2 pr-4 text-right font-medium">${Number(v.monto_total).toLocaleString('es-AR')}</td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">${Number(v.canon_monto).toLocaleString('es-AR')}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${estadoColor[v.estado] ?? ''}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="py-2">
                      {v.estado !== 'anulada' && (
                        <Button
                          size="sm" variant="ghost"
                          disabled={isPending}
                          onClick={() => {
                            if (!confirm('¿Anular esta venta?')) return
                            startTransition(async () => {
                              await anularVenta(v.id, 'Anulación manual')
                            })
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// --- Canon Tab ---
function CanonTab({ concesionarioId, canones }: { concesionarioId: string; canones: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    conciliado: 'bg-blue-100 text-blue-700',
    cobrado: 'bg-green-100 text-green-700',
    disputado: 'bg-red-100 text-red-700',
    anulado: 'bg-gray-100 text-gray-500',
  }

  return (
    <>
      <div className="flex gap-3 items-end">
        <div>
          <Label>Período</Label>
          <Input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} />
        </div>
        <Button
          disabled={isPending}
          onClick={() => startTransition(async () => { await calcularCanonPeriodo(concesionarioId, periodo) })}
        >
          <Calculator className="h-4 w-4 mr-1" /> {isPending ? 'Calculando...' : 'Calcular canon'}
        </Button>
      </div>

      {canones.length === 0 ? (
        <p className="text-muted-foreground text-sm mt-4">No hay cánones calculados.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-4">Período</th>
                <th className="py-2 pr-4 text-right">Ventas</th>
                <th className="py-2 pr-4 text-right">Total bruto</th>
                <th className="py-2 pr-4 text-right">Canon %</th>
                <th className="py-2 pr-4 text-right">Canon efectivo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {canones.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{c.periodo}</td>
                  <td className="py-2 pr-4 text-right">{c.cantidad_ventas}</td>
                  <td className="py-2 pr-4 text-right">${Number(c.total_ventas_brutas).toLocaleString('es-AR')}</td>
                  <td className="py-2 pr-4 text-right">{Number(c.canon_porcentaje_promedio ?? 0).toFixed(1)}%</td>
                  <td className="py-2 pr-4 text-right font-semibold text-primary">${Number(c.canon_efectivo).toLocaleString('es-AR')}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${estadoColor[c.estado] ?? ''}`}>{c.estado}</span>
                  </td>
                  <td className="py-2">
                    {c.estado === 'pendiente' && (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => {
                        startTransition(async () => { await cobrarCanon(c.id) })
                      }}>
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Cobrar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// --- MP Tab ---
function MPTab({ concesionario }: { concesionario: any }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuración MercadoPago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Modo actual:</span>
          <Badge variant={concesionario.mp_modo === 'production' ? 'default' : 'secondary'}>
            {concesionario.mp_modo}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {concesionario.mp_modo === 'mock'
            ? 'Los links de pago son simulados. Configurá credenciales reales para activar pagos.'
            : concesionario.mp_modo === 'sandbox'
            ? 'Modo sandbox: los pagos se procesan en entorno de prueba.'
            : 'Producción: los pagos son reales.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isPending} onClick={() => {
            startTransition(async () => {
              await editarConcesionario(concesionario.id, {
                nombre_comercial: concesionario.nombre_comercial,
                canon_porcentaje: concesionario.canon_porcentaje,
              })
            })
          }}>
            Configurar credenciales (FASE 7)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
