'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2, Check, Link as LinkIcon } from 'lucide-react'
import { registrarVenta } from '../../../../../_actions'
import { PersonaSearchInput } from '../../../../../_components/persona-search-input'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CartItem {
  producto_id: string
  nombre: string
  precio: number
  cantidad: number
}

interface Props {
  concesionarioId: string
  concesionarioNombre: string
  puntoVentaId: string
  puntoVentaNombre: string
  productos: any[]
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'mp_link', label: 'MercadoPago (Link)' },
  { value: 'mp_qr', label: 'MercadoPago (QR)' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
]

export function VenderClient({ concesionarioId, concesionarioNombre, puntoVentaId, puntoVentaNombre, productos }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [compradorPersonaId, setCompradorPersonaId] = useState('')
  const [compradorNombreLibre, setCompradorNombreLibre] = useState('')
  const [isPending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<{ ok: boolean; data?: any } | null>(null)
  const [search, setSearch] = useState('')

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  function addToCart(producto: any) {
    setCart(prev => {
      const existing = prev.find(i => i.producto_id === producto.id)
      if (existing) {
        return prev.map(i =>
          i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { producto_id: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: 1 }]
    })
  }

  function updateQuantity(productoId: string, delta: number) {
    setCart(prev =>
      prev
        .map(i => i.producto_id === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter(i => i.cantidad > 0)
    )
  }

  function handleConfirm() {
    if (cart.length === 0) return
    startTransition(async () => {
      const res = await registrarVenta({
        concesionario_id: concesionarioId,
        punto_venta_id: puntoVentaId,
        items: cart.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio })),
        metodo_pago: metodoPago,
        comprador_persona_id: compradorPersonaId || undefined,
        comprador_nombre_libre: compradorNombreLibre || undefined,
      })
      if (res.ok) {
        setResultado({ ok: true, data: res.data })
        setCart([])
      } else {
        setResultado({ ok: false, data: { error: res.message } })
      }
    })
  }

  const filteredProducts = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.categoria.includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/concesiones/${concesionarioId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{puntoVentaNombre}</h1>
          <p className="text-sm text-muted-foreground">{concesionarioNombre} — Registrar venta</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Product Grid (2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-3">
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((p: any) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors"
                disabled={p.stock_actual <= 0}
              >
                <p className="font-medium text-sm truncate">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">{p.categoria}{p.marca ? ` · ${p.marca}` : ''}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-primary">${Number(p.precio).toLocaleString('es-AR')}</span>
                  <span className={`text-xs ${p.stock_actual <= (p.stock_minimo ?? 0) ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Stock: {p.stock_actual}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart (1/3) */}
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Carrito
                {cart.length > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2">{cart.reduce((s, i) => s + i.cantidad, 0)}</span>}
              </h2>

              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Agregá productos tocando las tarjetas</p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.producto_id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-muted-foreground">${item.precio.toLocaleString('es-AR')} c/u</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.producto_id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.producto_id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setCart(c => c.filter(i => i.producto_id !== item.producto_id))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="w-20 text-right font-medium">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div>
                <Label>Comprador (opcional)</Label>
                <PersonaSearchInput
                  value={compradorPersonaId}
                  onChange={setCompradorPersonaId}
                  placeholder="Buscar socio..."
                />
                {!compradorPersonaId && (
                  <Input
                    className="mt-2"
                    placeholder="O nombre libre"
                    value={compradorNombreLibre}
                    onChange={e => setCompradorNombreLibre(e.target.value)}
                  />
                )}
              </div>

              <div>
                <Label>Método de pago</Label>
                <Select value={metodoPago} onValueChange={v => setMetodoPago(v ?? 'efectivo')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full h-12 text-base"
                disabled={isPending || cart.length === 0}
                onClick={handleConfirm}
              >
                {isPending ? 'Registrando...' : `Confirmar venta $${total.toLocaleString('es-AR')}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Result Dialog */}
      <Dialog open={!!resultado} onOpenChange={() => setResultado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resultado?.ok ? 'Venta registrada' : 'Error'}</DialogTitle>
          </DialogHeader>
          {resultado?.ok ? (
            <div className="text-center space-y-3 py-4">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-medium">Total: ${Number(resultado.data?.monto_total ?? 0).toLocaleString('es-AR')}</p>
              <p className="text-sm text-muted-foreground">Canon: ${Number(resultado.data?.canon_monto ?? 0).toLocaleString('es-AR')}</p>
              {resultado.data?.mp_link_pago && (
                <div className="flex items-center gap-2 justify-center">
                  <LinkIcon className="h-4 w-4" />
                  <a href={resultado.data.mp_link_pago} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                    Link de pago MP
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-destructive">{resultado?.data?.error ?? 'Error desconocido'}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
