'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Loader2,
  ShoppingBag,
  Wrench,
  CalendarCheck,
  Dumbbell,
  Key,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  crearProducto,
  editarProducto,
  toggleProductoActivo,
  eliminarProducto,
} from './_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Producto {
  id: string
  nombre: string
  tipo: string
  precio: number | null
  moneda: string
  descripcion: string | null
  es_arancelado: boolean
  cuenta_ingreso: string | null
  cuenta_egreso: string | null
  centro_costo: string | null
  categoria: string | null
  activo: boolean
  created_at: string
}

interface ProductoForm {
  nombre: string
  tipo: string
  precio: string
  moneda: string
  descripcion: string
  es_arancelado: boolean
  cuenta_ingreso: string
  cuenta_egreso: string
  centro_costo: string
  categoria: string
}

const EMPTY_FORM: ProductoForm = {
  nombre: '',
  tipo: 'producto',
  precio: '',
  moneda: 'ARS',
  descripcion: '',
  es_arancelado: true,
  cuenta_ingreso: '',
  cuenta_egreso: '',
  centro_costo: '',
  categoria: '',
}

// -------------------------------------------------------------------
// Constantes
// -------------------------------------------------------------------

const TIPOS = [
  { value: 'producto', label: 'Producto', icon: ShoppingBag },
  { value: 'servicio', label: 'Servicio', icon: Wrench },
  { value: 'cuota', label: 'Cuota', icon: CalendarCheck },
  { value: 'actividad', label: 'Actividad', icon: Dumbbell },
  { value: 'alquiler', label: 'Alquiler', icon: Key },
] as const

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'producto', label: 'Productos' },
  { key: 'servicio', label: 'Servicios' },
  { key: 'cuota', label: 'Cuotas' },
  { key: 'actividad', label: 'Actividades' },
  { key: 'alquiler', label: 'Alquileres' },
] as const

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function tipoLabel(tipo: string): string {
  return TIPOS.find((t) => t.value === tipo)?.label ?? tipo
}

function tipoBadgeClass(tipo: string): string {
  switch (tipo) {
    case 'producto':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'servicio':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'cuota':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'actividad':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'alquiler':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return ''
  }
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  // Fetch productos
  async function fetchProductos() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre')

    if (!error && data) {
      setProductos(data as Producto[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const productosFiltrados =
    filtro === 'todos' ? productos : productos.filter((p) => p.tipo === filtro)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(producto: Producto) {
    setEditingId(producto.id)
    setForm({
      nombre: producto.nombre,
      tipo: producto.tipo,
      precio: producto.precio != null ? String(producto.precio) : '',
      moneda: producto.moneda || 'ARS',
      descripcion: producto.descripcion || '',
      es_arancelado: producto.es_arancelado,
      cuenta_ingreso: producto.cuenta_ingreso || '',
      cuenta_egreso: producto.cuenta_egreso || '',
      centro_costo: producto.centro_costo || '',
      categoria: producto.categoria || '',
    })
    setDialogOpen(true)
  }

  function handleSubmit() {
    const input = {
      nombre: form.nombre,
      tipo: form.tipo,
      precio: form.precio ? parseFloat(form.precio) : null,
      moneda: form.moneda,
      descripcion: form.descripcion || null,
      es_arancelado: form.es_arancelado,
      cuenta_ingreso: form.cuenta_ingreso || null,
      cuenta_egreso: form.cuenta_egreso || null,
      centro_costo: form.centro_costo || null,
      categoria: form.categoria || null,
    }

    startTransition(async () => {
      const result = editingId
        ? await editarProducto(editingId, input)
        : await crearProducto(input)

      if (result.ok) {
        toast.success(result.message)
        setDialogOpen(false)
        setForm(EMPTY_FORM)
        setEditingId(null)
        fetchProductos()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleToggleActivo(producto: Producto) {
    startTransition(async () => {
      const result = await toggleProductoActivo(producto.id, !producto.activo)
      if (result.ok) {
        toast.success(result.message)
        fetchProductos()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleEliminar(productoId: string) {
    startTransition(async () => {
      const result = await eliminarProducto(productoId)
      if (result.ok) {
        toast.success(result.message)
        fetchProductos()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Productos y Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogo de productos, servicios, cuotas, actividades y alquileres
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filtro === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : productosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay productos</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filtro !== 'todos'
                ? `No hay items de tipo "${tipoLabel(filtro)}".`
                : 'Crea tu primer producto o servicio.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tipoBadgeClass(producto.tipo)}>
                          {tipoLabel(producto.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMoney(producto.precio, producto.moneda)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {producto.categoria || '-'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={producto.activo}
                          onCheckedChange={() => handleToggleActivo(producto)}
                          size="sm"
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" disabled={isPending} />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(producto)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleEliminar(producto.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {productosFiltrados.map((producto) => (
              <Card key={producto.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{producto.nombre}</p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${tipoBadgeClass(producto.tipo)}`}
                        >
                          {tipoLabel(producto.tipo)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {formatMoney(producto.precio, producto.moneda)}
                        </span>
                        {producto.categoria && <span>{producto.categoria}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={producto.activo}
                        onCheckedChange={() => handleToggleActivo(producto)}
                        size="sm"
                        disabled={isPending}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" disabled={isPending} />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(producto)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleEliminar(producto.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog crear/editar */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditingId(null)
            setForm(EMPTY_FORM)
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica los datos del producto o servicio.'
                : 'Completa los datos para crear un nuevo producto o servicio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="prod-nombre">Nombre *</Label>
              <Input
                id="prod-nombre"
                placeholder="Ej: Cuota social mensual"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(val) => setForm({ ...form, tipo: val ?? 'producto' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio + Moneda */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="prod-precio">Precio</Label>
                <Input
                  id="prod-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={form.moneda}
                  onValueChange={(val) => setForm({ ...form, moneda: val ?? 'ARS' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="prod-categoria">Categoria</Label>
              <Input
                id="prod-categoria"
                placeholder="Ej: Deportes, Social, Infraestructura"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </div>

            {/* Descripcion */}
            <div className="space-y-2">
              <Label htmlFor="prod-descripcion">Descripcion</Label>
              <Textarea
                id="prod-descripcion"
                placeholder="Descripcion del producto o servicio..."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
              />
            </div>

            {/* Es arancelado */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Es arancelado</p>
                <p className="text-xs text-muted-foreground">
                  Indica si este item genera un cobro
                </p>
              </div>
              <Switch
                checked={form.es_arancelado}
                onCheckedChange={(checked) =>
                  setForm({ ...form, es_arancelado: Boolean(checked) })
                }
              />
            </div>

            {/* Cuentas contables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prod-cuenta-ingreso">Cuenta ingreso</Label>
                <Input
                  id="prod-cuenta-ingreso"
                  placeholder="Ej: 4.1.01"
                  value={form.cuenta_ingreso}
                  onChange={(e) => setForm({ ...form, cuenta_ingreso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-cuenta-egreso">Cuenta egreso</Label>
                <Input
                  id="prod-cuenta-egreso"
                  placeholder="Ej: 5.1.01"
                  value={form.cuenta_egreso}
                  onChange={(e) => setForm({ ...form, cuenta_egreso: e.target.value })}
                />
              </div>
            </div>

            {/* Centro de costo */}
            <div className="space-y-2">
              <Label htmlFor="prod-centro-costo">Centro de costo</Label>
              <Input
                id="prod-centro-costo"
                placeholder="Ej: Futbol, Administracion"
                value={form.centro_costo}
                onChange={(e) => setForm({ ...form, centro_costo: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingId(null)
                setForm(EMPTY_FORM)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
