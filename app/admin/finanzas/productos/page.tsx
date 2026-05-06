'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { SelectionBar } from '@/components/ui/selection-bar'
import { ExportFormatSelector } from '@/components/ui/export-format-selector'
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
  Landmark,
  Receipt,
  Search,
  DollarSign,
  ShoppingCart,
  Check,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  crearProducto,
  editarProducto,
  toggleProductoActivo,
  eliminarProducto,
} from './_actions'
import type { ExportData } from '@/lib/export/formats'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface CentroCosto {
  id: string
  nombre: string
}

interface CategoriaMovimiento {
  id: string
  nombre: string
}

interface CuentaImputable {
  id: string
  codigo: string
  nombre: string
}

interface Producto {
  id: string
  nombre: string
  tipo: string
  precio: number | null
  moneda: string
  descripcion: string | null
  es_arancelado: boolean
  es_comprable: boolean
  cuenta_ingreso_id: string | null
  cuenta_egreso_id: string | null
  centro_costo_id: string | null
  categoria_movimiento_id: string | null
  activo: boolean
  created_at: string
  // Joined data (pueden venir como objeto o array por Supabase)
  centro_costo: unknown
  categoria: unknown
  cuenta_ingreso: unknown
  cuenta_egreso: unknown
}

interface ProductoForm {
  nombre: string
  tipo: string
  precio: string
  moneda: string
  descripcion: string
  es_arancelado: boolean
  es_comprable: boolean
  cuenta_ingreso_id: string
  cuenta_egreso_id: string
  centro_costo_id: string
  categoria_movimiento_id: string
}

const EMPTY_FORM: ProductoForm = {
  nombre: '',
  tipo: 'producto',
  precio: '',
  moneda: 'ARS',
  descripcion: '',
  es_arancelado: true,
  es_comprable: false,
  cuenta_ingreso_id: '',
  cuenta_egreso_id: '',
  centro_costo_id: '',
  categoria_movimiento_id: '',
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
  { value: 'insumo', label: 'Insumo', icon: Package },
  { value: 'activo', label: 'Activo fijo', icon: Landmark },
  { value: 'gasto', label: 'Gasto operativo', icon: Receipt },
] as const

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'producto', label: 'Productos' },
  { key: 'servicio', label: 'Servicios' },
  { key: 'cuota', label: 'Cuotas' },
  { key: 'actividad', label: 'Actividades' },
  { key: 'alquiler', label: 'Alquileres' },
  { key: 'insumo', label: 'Insumos' },
  { key: 'activo', label: 'Activos fijos' },
  { key: 'gasto', label: 'Gastos' },
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
    case 'insumo':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
    case 'activo':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    case 'gasto':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

/** Normaliza joins de Supabase que pueden venir como array u objeto */
function resolveJoin<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return (raw[0] as T) ?? null
  return raw as T
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Datos para selects del formulario
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
  const [categorias, setCategorias] = useState<CategoriaMovimiento[]>([])
  const [cuentasImputables, setCuentasImputables] = useState<CuentaImputable[]>([])

  // ---- Data fetching ----

  const fetchProductos = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos_servicios')
      .select(`
        id, nombre, tipo, precio, moneda, descripcion,
        es_arancelado, es_comprable,
        cuenta_ingreso_id, cuenta_egreso_id,
        centro_costo_id, categoria_movimiento_id,
        activo, created_at,
        centro_costo:centros_costo(nombre),
        categoria:catalogo_categorias_movimiento(nombre),
        cuenta_ingreso:plan_cuentas!productos_servicios_cuenta_ingreso_id_fkey(codigo, nombre),
        cuenta_egreso:plan_cuentas!productos_servicios_cuenta_egreso_id_fkey(codigo, nombre)
      `)
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre')

    if (!error && data) {
      setProductos(data as unknown as Producto[])
    }
    setLoading(false)
  }, [])

  const fetchCentrosCosto = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('centros_costo')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .order('nombre')

    if (data) setCentrosCosto(data)
  }, [])

  const fetchCategorias = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('catalogo_categorias_movimiento')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .order('nombre')

    if (data) setCategorias(data)
  }, [])

  const fetchCuentasImputables = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre')
      .eq('tenant_id', TENANT_ID)
      .eq('es_imputable', true)
      .order('codigo')

    if (data) setCuentasImputables(data)
  }, [])

  useEffect(() => {
    fetchProductos()
    fetchCentrosCosto()
    fetchCategorias()
    fetchCuentasImputables()
  }, [fetchProductos, fetchCentrosCosto, fetchCategorias, fetchCuentasImputables])

  // ---- Filtrado client-side ----

  const productosFiltrados = productos.filter((p) => {
    if (filtro !== 'todos' && p.tipo !== filtro) return false
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      if (!p.nombre.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ---- Seleccion ----

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(productosFiltrados.map((p) => p.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = productosFiltrados.length > 0 && selected.size === productosFiltrados.length

  // ---- Export data ----

  function buildExportData(items: Producto[]): ExportData | null {
    if (items.length === 0) return null
    return {
      headers: [
        'Nombre',
        'Tipo',
        'Precio',
        'Moneda',
        'Categoria',
        'Centro de costo',
        'Vendible',
        'Comprable',
        'Cuenta ingreso',
        'Cuenta egreso',
        'Activo',
      ],
      rows: items.map((p) => {
        const centro = resolveJoin<{ nombre: string }>(p.centro_costo)
        const cat = resolveJoin<{ nombre: string }>(p.categoria)
        const cIngreso = resolveJoin<{ codigo: string; nombre: string }>(p.cuenta_ingreso)
        const cEgreso = resolveJoin<{ codigo: string; nombre: string }>(p.cuenta_egreso)
        return [
          p.nombre,
          tipoLabel(p.tipo),
          p.precio != null ? String(p.precio) : '',
          p.moneda,
          cat?.nombre ?? '',
          centro?.nombre ?? '',
          p.es_arancelado ? 'Si' : 'No',
          p.es_comprable ? 'Si' : 'No',
          cIngreso ? `${cIngreso.codigo} - ${cIngreso.nombre}` : '',
          cEgreso ? `${cEgreso.codigo} - ${cEgreso.nombre}` : '',
          p.activo ? 'Si' : 'No',
        ]
      }),
      filename: `productos_servicios_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function getSelectionExportData(): ExportData | null {
    const items = productosFiltrados.filter((p) => selected.has(p.id))
    return buildExportData(items)
  }

  function getAllExportData(): ExportData | null {
    return buildExportData(productosFiltrados)
  }

  // ---- Dialog crear / editar ----

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
      es_comprable: producto.es_comprable,
      cuenta_ingreso_id: producto.cuenta_ingreso_id || '',
      cuenta_egreso_id: producto.cuenta_egreso_id || '',
      centro_costo_id: producto.centro_costo_id || '',
      categoria_movimiento_id: producto.categoria_movimiento_id || '',
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
      es_comprable: form.es_comprable,
      cuenta_ingreso_id: form.cuenta_ingreso_id || null,
      cuenta_egreso_id: form.cuenta_egreso_id || null,
      centro_costo_id: form.centro_costo_id || null,
      categoria_movimiento_id: form.categoria_movimiento_id || null,
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

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Productos y Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogo de productos, servicios, cuotas, actividades, alquileres y gastos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportFormatSelector getData={getAllExportData} />
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nuevo producto</span>
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filtro === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFiltro(f.key); clearSelection() }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Contenido principal */}
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
              {search.trim()
                ? `No se encontraron resultados para "${search}".`
                : filtro !== 'todos'
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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => allSelected ? clearSelection() : selectAll()}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Centro costo</TableHead>
                    <TableHead className="text-center">Vendible</TableHead>
                    <TableHead className="text-center">Comprable</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => {
                    const centro = resolveJoin<{ nombre: string }>(producto.centro_costo)
                    const cat = resolveJoin<{ nombre: string }>(producto.categoria)
                    const isSelected = selected.has(producto.id)

                    return (
                      <TableRow
                        key={producto.id}
                        className={isSelected ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(producto.id)}
                          />
                        </TableCell>
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
                          {cat?.nombre ?? '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {centro?.nombre ?? '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {producto.es_arancelado ? (
                            <DollarSign className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {producto.es_comprable ? (
                            <ShoppingCart className="h-4 w-4 text-blue-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={producto.activo}
                            onCheckedChange={() => handleToggleActivo(producto)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} />
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
                                className="text-destructive"
                                onClick={() => handleEliminar(producto.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {productosFiltrados.map((producto) => {
              const centro = resolveJoin<{ nombre: string }>(producto.centro_costo)
              const cat = resolveJoin<{ nombre: string }>(producto.categoria)
              const isSelected = selected.has(producto.id)

              return (
                <Card
                  key={producto.id}
                  className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => toggleSelect(producto.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{producto.nombre}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${tipoBadgeClass(producto.tipo)}`}
                          >
                            {tipoLabel(producto.tipo)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {formatMoney(producto.precio, producto.moneda)}
                          </span>
                          {cat?.nombre && <span>{cat.nombre}</span>}
                          {centro?.nombre && <span>{centro.nombre}</span>}
                        </div>
                        <div className="flex gap-3 mt-2">
                          {producto.es_arancelado && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                              <DollarSign className="h-3 w-3" /> Vendible
                            </span>
                          )}
                          {producto.es_comprable && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400">
                              <ShoppingCart className="h-3 w-3" /> Comprable
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={producto.activo}
                          onCheckedChange={() => handleToggleActivo(producto)}
                          disabled={isPending}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} />
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
                              className="text-destructive"
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
              )
            })}
          </div>
        </>
      )}

      {/* Conteo */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {productosFiltrados.length} item{productosFiltrados.length !== 1 ? 's' : ''}
          {filtro !== 'todos' ? ` de tipo "${tipoLabel(filtro)}"` : ' en total'}
        </p>
      )}

      {/* Selection bar */}
      <SelectionBar
        count={selected.size}
        total={productosFiltrados.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getSelectionExportData}
      />

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
                  {TIPOS.map((t) => {
                    const Icon = t.icon
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    )
                  })}
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
                <p className="text-sm font-medium">Genera cobro / se vende</p>
                <p className="text-xs text-muted-foreground">
                  Indica si este item genera un ingreso
                </p>
              </div>
              <Switch
                checked={form.es_arancelado}
                onCheckedChange={(checked) =>
                  setForm({ ...form, es_arancelado: Boolean(checked) })
                }
              />
            </div>

            {/* Es comprable */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Se compra / es gasto</p>
                <p className="text-xs text-muted-foreground">
                  Indica si este item representa un egreso
                </p>
              </div>
              <Switch
                checked={form.es_comprable}
                onCheckedChange={(checked) =>
                  setForm({ ...form, es_comprable: Boolean(checked) })
                }
              />
            </div>

            {/* Cuenta ingreso */}
            <div className="space-y-2">
              <Label>Cuenta de ingreso</Label>
              <Select
                value={form.cuenta_ingreso_id || '_none'}
                onValueChange={(val) =>
                  setForm({ ...form, cuenta_ingreso_id: val === '_none' ? '' : (val ?? '') })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin cuenta</SelectItem>
                  {cuentasImputables.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cuenta egreso */}
            <div className="space-y-2">
              <Label>Cuenta de egreso</Label>
              <Select
                value={form.cuenta_egreso_id || '_none'}
                onValueChange={(val) =>
                  setForm({ ...form, cuenta_egreso_id: val === '_none' ? '' : (val ?? '') })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin cuenta</SelectItem>
                  {cuentasImputables.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de costo */}
            <div className="space-y-2">
              <Label>Centro de costo</Label>
              <Select
                value={form.centro_costo_id || '_none'}
                onValueChange={(val) =>
                  setForm({ ...form, centro_costo_id: val === '_none' ? '' : (val ?? '') })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar centro de costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin centro de costo</SelectItem>
                  {centrosCosto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria movimiento */}
            <div className="space-y-2">
              <Label>Categoria de movimiento</Label>
              <Select
                value={form.categoria_movimiento_id || '_none'}
                onValueChange={(val) =>
                  setForm({ ...form, categoria_movimiento_id: val === '_none' ? '' : (val ?? '') })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin categoria</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button onClick={handleSubmit} disabled={isPending || !form.nombre.trim()}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
