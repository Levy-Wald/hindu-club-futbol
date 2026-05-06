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
  Lock,
  Car,
  Home,
  AlertTriangle,
  Coffee,
  ChevronDown,
  ChevronRight,
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
  sku: string | null
  ean13: string | null
  ean14: string | null
  marca: string | null
  modelo: string | null
  color: string | null
  material: string | null
  origen: string | null
  unidad_medida: string
  descripcion: string | null
  descripcion_larga: string | null
  precio: number | null
  precio_compra: number | null
  moneda: string
  iva_compra: number | null
  iva_venta: number | null
  es_arancelado: boolean
  es_comprable: boolean
  stock_actual: number | null
  stock_minimo: number | null
  peso_kg: number | null
  cupo_maximo: number | null
  instalacion: string | null
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
  sku: string
  ean13: string
  ean14: string
  marca: string
  modelo: string
  color: string
  material: string
  origen: string
  unidad_medida: string
  descripcion: string
  descripcion_larga: string
  precio: string
  precio_compra: string
  moneda: string
  iva_compra: string
  iva_venta: string
  es_arancelado: boolean
  es_comprable: boolean
  stock_actual: string
  stock_minimo: string
  peso_kg: string
  cupo_maximo: string
  instalacion: string
  cuenta_ingreso_id: string
  cuenta_egreso_id: string
  centro_costo_id: string
  categoria_movimiento_id: string
}

const EMPTY_FORM: ProductoForm = {
  nombre: '',
  tipo: 'producto',
  sku: '',
  ean13: '',
  ean14: '',
  marca: '',
  modelo: '',
  color: '',
  material: '',
  origen: '',
  unidad_medida: 'unidad',
  descripcion: '',
  descripcion_larga: '',
  precio: '',
  precio_compra: '',
  moneda: 'ARS',
  iva_compra: '21',
  iva_venta: '21',
  es_arancelado: true,
  es_comprable: false,
  stock_actual: '',
  stock_minimo: '',
  peso_kg: '',
  cupo_maximo: '',
  instalacion: '',
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
  { value: 'locker', label: 'Locker', icon: Lock },
  { value: 'cochera', label: 'Cochera', icon: Car },
  { value: 'expensa', label: 'Expensa', icon: Home },
  { value: 'multa', label: 'Multa', icon: AlertTriangle },
  { value: 'consumo', label: 'Consumo', icon: Coffee },
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
  { key: 'locker', label: 'Lockers' },
  { key: 'cochera', label: 'Cocheras' },
  { key: 'expensa', label: 'Expensas' },
  { key: 'multa', label: 'Multas' },
  { key: 'consumo', label: 'Consumos' },
] as const

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kg' },
  { value: 'litro', label: 'Litro' },
  { value: 'metro', label: 'Metro' },
  { value: 'hora', label: 'Hora' },
  { value: 'm2', label: 'm2' },
  { value: 'par', label: 'Par' },
] as const

const IVA_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '10.5', label: '10.5%' },
  { value: '21', label: '21%' },
  { value: '27', label: '27%' },
] as const

const TIPOS_CON_STOCK = ['producto', 'insumo', 'activo']
const TIPOS_CON_CUPO = ['actividad', 'servicio', 'alquiler']

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

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
    case 'locker':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'cochera':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
    case 'expensa':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    case 'multa':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    case 'consumo':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
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

  // Secciones colapsables del formulario
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['identidad']))

  // Datos para selects del formulario
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
  const [categorias, setCategorias] = useState<CategoriaMovimiento[]>([])
  const [cuentasImputables, setCuentasImputables] = useState<CuentaImputable[]>([])

  // ---- Collapsible sections ----

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ---- Data fetching ----

  const fetchProductos = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos_servicios')
      .select(`
        id, nombre, tipo, sku, ean13, ean14, marca, modelo, color, material, origen,
        unidad_medida, descripcion, descripcion_larga,
        precio, precio_compra, moneda, iva_compra, iva_venta,
        es_arancelado, es_comprable,
        stock_actual, stock_minimo, peso_kg, cupo_maximo, instalacion,
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
      const searchable = [p.nombre, p.sku, p.marca, p.modelo].filter(Boolean).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
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
        'SKU',
        'Marca',
        'Modelo',
        'Precio venta',
        'Precio compra',
        'Moneda',
        'IVA venta',
        'IVA compra',
        'Categoria',
        'Centro de costo',
        'Vendible',
        'Comprable',
        'Cuenta ingreso',
        'Cuenta egreso',
        'Stock actual',
        'Stock minimo',
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
          p.sku ?? '',
          p.marca ?? '',
          p.modelo ?? '',
          p.precio != null ? String(p.precio) : '',
          p.precio_compra != null ? String(p.precio_compra) : '',
          p.moneda,
          p.iva_venta != null ? String(p.iva_venta) : '',
          p.iva_compra != null ? String(p.iva_compra) : '',
          cat?.nombre ?? '',
          centro?.nombre ?? '',
          p.es_arancelado ? 'Si' : 'No',
          p.es_comprable ? 'Si' : 'No',
          cIngreso ? `${cIngreso.codigo} - ${cIngreso.nombre}` : '',
          cEgreso ? `${cEgreso.codigo} - ${cEgreso.nombre}` : '',
          p.stock_actual != null ? String(p.stock_actual) : '',
          p.stock_minimo != null ? String(p.stock_minimo) : '',
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
    setOpenSections(new Set(['identidad']))
    setDialogOpen(true)
  }

  function openEdit(producto: Producto) {
    setEditingId(producto.id)
    setForm({
      nombre: producto.nombre,
      tipo: producto.tipo,
      sku: producto.sku || '',
      ean13: producto.ean13 || '',
      ean14: producto.ean14 || '',
      marca: producto.marca || '',
      modelo: producto.modelo || '',
      color: producto.color || '',
      material: producto.material || '',
      origen: producto.origen || '',
      unidad_medida: producto.unidad_medida || 'unidad',
      descripcion: producto.descripcion || '',
      descripcion_larga: producto.descripcion_larga || '',
      precio: producto.precio != null ? String(producto.precio) : '',
      precio_compra: producto.precio_compra != null ? String(producto.precio_compra) : '',
      moneda: producto.moneda || 'ARS',
      iva_compra: producto.iva_compra != null ? String(producto.iva_compra) : '21',
      iva_venta: producto.iva_venta != null ? String(producto.iva_venta) : '21',
      es_arancelado: producto.es_arancelado,
      es_comprable: producto.es_comprable,
      stock_actual: producto.stock_actual != null ? String(producto.stock_actual) : '',
      stock_minimo: producto.stock_minimo != null ? String(producto.stock_minimo) : '',
      peso_kg: producto.peso_kg != null ? String(producto.peso_kg) : '',
      cupo_maximo: producto.cupo_maximo != null ? String(producto.cupo_maximo) : '',
      instalacion: producto.instalacion || '',
      cuenta_ingreso_id: producto.cuenta_ingreso_id || '',
      cuenta_egreso_id: producto.cuenta_egreso_id || '',
      centro_costo_id: producto.centro_costo_id || '',
      categoria_movimiento_id: producto.categoria_movimiento_id || '',
    })
    setOpenSections(new Set(['identidad']))
    setDialogOpen(true)
  }

  function handleSubmit() {
    const input = {
      nombre: form.nombre,
      tipo: form.tipo,
      sku: form.sku || null,
      ean13: form.ean13 || null,
      ean14: form.ean14 || null,
      marca: form.marca || null,
      modelo: form.modelo || null,
      color: form.color || null,
      material: form.material || null,
      origen: form.origen || null,
      unidad_medida: form.unidad_medida || 'unidad',
      descripcion: form.descripcion || null,
      descripcion_larga: form.descripcion_larga || null,
      precio: form.precio ? parseFloat(form.precio) : null,
      precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : null,
      moneda: form.moneda,
      iva_compra: form.iva_compra ? parseFloat(form.iva_compra) : null,
      iva_venta: form.iva_venta ? parseFloat(form.iva_venta) : null,
      es_arancelado: form.es_arancelado,
      es_comprable: form.es_comprable,
      stock_actual: form.stock_actual ? parseFloat(form.stock_actual) : null,
      stock_minimo: form.stock_minimo ? parseFloat(form.stock_minimo) : null,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      cupo_maximo: form.cupo_maximo ? parseInt(form.cupo_maximo, 10) : null,
      instalacion: form.instalacion || null,
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

  // Determinar si mostrar seccion inventario segun tipo
  const showStock = TIPOS_CON_STOCK.includes(form.tipo)
  const showCupo = TIPOS_CON_CUPO.includes(form.tipo)
  const showInventario = showStock || showCupo

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
          placeholder="Buscar por nombre, SKU, marca..."
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Precio venta</TableHead>
                    <TableHead className="text-right">Precio compra</TableHead>
                    <TableHead className="text-center">Vendible</TableHead>
                    <TableHead className="text-center">Comprable</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => {
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
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {producto.sku || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={tipoBadgeClass(producto.tipo)}>
                            {tipoLabel(producto.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatMoney(producto.precio, producto.moneda)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatMoney(producto.precio_compra, producto.moneda)}
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
                          {producto.sku && (
                            <span className="font-mono">SKU: {producto.sku}</span>
                          )}
                          <span className="font-mono">
                            Venta: {formatMoney(producto.precio, producto.moneda)}
                          </span>
                          {producto.precio_compra != null && (
                            <span className="font-mono">
                              Compra: {formatMoney(producto.precio_compra, producto.moneda)}
                            </span>
                          )}
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

          <div className="space-y-1">
            {/* ============================================================ */}
            {/* SECCION 1: Identidad (siempre abierta) */}
            {/* ============================================================ */}
            <button
              type="button"
              onClick={() => toggleSection('identidad')}
              className="flex items-center justify-between w-full py-2 text-sm font-medium"
            >
              Identidad
              {openSections.has('identidad') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openSections.has('identidad') && (
              <div className="space-y-3 pb-3">
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

                {/* Marca + Modelo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prod-marca">Marca</Label>
                    <Input
                      id="prod-marca"
                      placeholder="Ej: Nike"
                      value={form.marca}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-modelo">Modelo</Label>
                    <Input
                      id="prod-modelo"
                      placeholder="Ej: Air Max"
                      value={form.modelo}
                      onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    />
                  </div>
                </div>

                {/* SKU + EAN13 + EAN14 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prod-sku">SKU</Label>
                    <Input
                      id="prod-sku"
                      placeholder="SKU-001"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-ean13">EAN13</Label>
                    <Input
                      id="prod-ean13"
                      placeholder="7790001000"
                      value={form.ean13}
                      onChange={(e) => setForm({ ...form, ean13: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-ean14">EAN14</Label>
                    <Input
                      id="prod-ean14"
                      placeholder="17790001000"
                      value={form.ean14}
                      onChange={(e) => setForm({ ...form, ean14: e.target.value })}
                    />
                  </div>
                </div>

                {/* Color + Material + Origen */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prod-color">Color</Label>
                    <Input
                      id="prod-color"
                      placeholder="Rojo"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-material">Material</Label>
                    <Input
                      id="prod-material"
                      placeholder="Algodon"
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-origen">Origen</Label>
                    <Input
                      id="prod-origen"
                      placeholder="Nacional"
                      value={form.origen}
                      onChange={(e) => setForm({ ...form, origen: e.target.value })}
                    />
                  </div>
                </div>

                {/* Unidad de medida */}
                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <Select
                    value={form.unidad_medida}
                    onValueChange={(val) => setForm({ ...form, unidad_medida: val ?? 'unidad' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descripcion */}
                <div className="space-y-2">
                  <Label htmlFor="prod-descripcion">Descripcion</Label>
                  <Textarea
                    id="prod-descripcion"
                    placeholder="Descripcion corta..."
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Descripcion larga */}
                <div className="space-y-2">
                  <Label htmlFor="prod-descripcion-larga">Descripcion larga</Label>
                  <Textarea
                    id="prod-descripcion-larga"
                    placeholder="Descripcion detallada del producto o servicio..."
                    value={form.descripcion_larga}
                    onChange={(e) => setForm({ ...form, descripcion_larga: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SECCION 2: Precios e impuestos */}
            {/* ============================================================ */}
            <div className="border-t pt-1">
              <button
                type="button"
                onClick={() => toggleSection('precios')}
                className="flex items-center justify-between w-full py-2 text-sm font-medium"
              >
                Precios e impuestos
                {openSections.has('precios') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {openSections.has('precios') && (
                <div className="space-y-3 pb-3">
                  {/* Precio venta + Moneda */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="prod-precio">Precio venta (sin imp.)</Label>
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

                  {/* Precio compra */}
                  <div className="space-y-2">
                    <Label htmlFor="prod-precio-compra">Precio compra (sin imp.)</Label>
                    <Input
                      id="prod-precio-compra"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.precio_compra}
                      onChange={(e) => setForm({ ...form, precio_compra: e.target.value })}
                    />
                  </div>

                  {/* IVA venta + IVA compra */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>IVA venta</Label>
                      <Select
                        value={form.iva_venta}
                        onValueChange={(val) => setForm({ ...form, iva_venta: val ?? '21' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IVA_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>IVA compra</Label>
                      <Select
                        value={form.iva_compra}
                        onValueChange={(val) => setForm({ ...form, iva_compra: val ?? '21' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IVA_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* SECCION 3: Inventario (solo para tipos con stock/cupo) */}
            {/* ============================================================ */}
            {showInventario && (
              <div className="border-t pt-1">
                <button
                  type="button"
                  onClick={() => toggleSection('inventario')}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium"
                >
                  Inventario
                  {openSections.has('inventario') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {openSections.has('inventario') && (
                  <div className="space-y-3 pb-3">
                    {showStock && (
                      <>
                        {/* Stock actual + Stock minimo */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="prod-stock-actual">Stock actual</Label>
                            <Input
                              id="prod-stock-actual"
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={form.stock_actual}
                              onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prod-stock-minimo">Stock minimo</Label>
                            <Input
                              id="prod-stock-minimo"
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={form.stock_minimo}
                              onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Peso */}
                        <div className="space-y-2">
                          <Label htmlFor="prod-peso">Peso (kg)</Label>
                          <Input
                            id="prod-peso"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.peso_kg}
                            onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {showCupo && (
                      <div className="space-y-2">
                        <Label htmlFor="prod-cupo">Cupo maximo</Label>
                        <Input
                          id="prod-cupo"
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Sin limite"
                          value={form.cupo_maximo}
                          onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Instalacion */}
                    <div className="space-y-2">
                      <Label htmlFor="prod-instalacion">Instalacion</Label>
                      <Input
                        id="prod-instalacion"
                        placeholder="Ej: Cancha 1, Salon principal"
                        value={form.instalacion}
                        onChange={(e) => setForm({ ...form, instalacion: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* SECCION 4: Contabilidad */}
            {/* ============================================================ */}
            <div className="border-t pt-1">
              <button
                type="button"
                onClick={() => toggleSection('contabilidad')}
                className="flex items-center justify-between w-full py-2 text-sm font-medium"
              >
                Contabilidad
                {openSections.has('contabilidad') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {openSections.has('contabilidad') && (
                <div className="space-y-3 pb-3">
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
              )}
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
