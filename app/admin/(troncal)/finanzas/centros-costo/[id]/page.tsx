'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Loader2,
  ArrowLeft,
  ArrowLeftRight,
  Package,
  FolderTree,
  Settings,
  Plus,
  ChevronRight,
} from 'lucide-react'
import {
  obtenerCentroConStats,
  editarCentroCosto,
  listarMovimientosPorCentro,
  listarProductosPorCentro,
  listarSubcentros,
  listarCentrosCosto,
} from '@/modules/finanzas/lib/centros-costo'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface CentroStats {
  id: string
  nombre: string
  codigo: string | null
  tipo: string
  padre_id: string | null
  activo: boolean
  metadata: Record<string, unknown> | null
  cant_movimientos: number
  total_ingresos: number
  total_egresos: number
  neto: number
  cant_productos: number
  cant_subcentros: number
}

interface Movimiento {
  id: string
  tipo: string
  monto_bruto: number
  monto_neto: number
  fecha: string
  descripcion: string | null
  anulado: boolean
  comprobante_numero: string | null
  cajas: { nombre: string }[]
  medios_pago: { nombre: string }[] | null
  personas: { nombre: string; apellido: string }[] | null
}

interface Producto {
  id: string
  nombre: string
  tipo: string
  precio_base: number
  moneda: string
  activo: boolean
}

interface Subcentro {
  id: string
  nombre: string
  codigo: string | null
  tipo: string
  activo: boolean
  cant_movimientos: number
  total_ingresos: number
  total_egresos: number
  neto: number
}

const TIPOS = [
  { value: 'general', label: 'General' },
  { value: 'area', label: 'Área' },
  { value: 'disciplina', label: 'Disciplina' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'sede', label: 'Sede' },
  { value: 'evento', label: 'Evento' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'otro', label: 'Otro' },
] as const

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

function tipoLabel(tipo: string) {
  return TIPOS.find(t => t.value === tipo)?.label ?? tipo
}

// -------------------------------------------------------------------
// Componente
// -------------------------------------------------------------------

export default function CentroCostoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [centro, setCentro] = useState<CentroStats | null>(null)
  const [padreNombre, setPadreNombre] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [subcentros, setSubcentros] = useState<Subcentro[]>([])
  const [todosLosCentros, setTodosLosCentros] = useState<CentroStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [filtroTipoMov, setFiltroTipoMov] = useState('todos')

  // Edit form state
  const [editNombre, setEditNombre] = useState('')
  const [editTipo, setEditTipo] = useState('')
  const [editPadreId, setEditPadreId] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')

  async function loadData() {
    const [centroData, movsData, prodsData, subsData, todosData] = await Promise.all([
      obtenerCentroConStats(id),
      listarMovimientosPorCentro(id, { tipo: filtroTipoMov !== 'todos' ? filtroTipoMov : undefined }),
      listarProductosPorCentro(id),
      listarSubcentros(id),
      listarCentrosCosto({ activo: 'true' }),
    ])

    if (!centroData) {
      router.push('/admin/finanzas/centros-costo')
      return
    }

    setCentro(centroData as unknown as CentroStats)
    setMovimientos(movsData as unknown as Movimiento[])
    setProductos(prodsData as unknown as Producto[])
    setSubcentros(subsData as unknown as Subcentro[])
    setTodosLosCentros(todosData as unknown as CentroStats[])

    // Set edit form defaults
    setEditNombre(centroData.nombre as string)
    setEditTipo(centroData.tipo as string)
    setEditPadreId((centroData.padre_id as string) ?? '')
    setEditDescripcion(((centroData.metadata as Record<string, string>)?.descripcion) ?? '')

    // Get parent name
    if (centroData.padre_id) {
      const padreData = todosData.find((c: Record<string, unknown>) => c.id === centroData.padre_id)
      if (padreData) setPadreNombre(padreData.nombre as string)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Reload movimientos on filter change
  useEffect(() => {
    if (!loading) {
      listarMovimientosPorCentro(id, { tipo: filtroTipoMov !== 'todos' ? filtroTipoMov : undefined })
        .then(data => setMovimientos(data as unknown as Movimiento[]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipoMov])

  function handleSaveConfig() {
    startTransition(async () => {
      const result = await editarCentroCosto(id, {
        nombre: editNombre,
        tipo: editTipo,
        padre_id: editPadreId || null,
        referencia_tipo: null,
        referencia_id: null,
        descripcion: editDescripcion || null,
        activo: centro?.activo ?? true,
      })
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

  if (!centro) return null

  const centrosPadreOptions = todosLosCentros.filter(c => c.id !== id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/admin/finanzas/centros-costo" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Centros de costo
          </Link>
          {padreNombre && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{padreNombre}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{centro.nombre}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">{centro.nombre}</h1>
          <Badge variant="outline" className="font-mono">{centro.codigo}</Badge>
          <Badge variant="secondary">{tipoLabel(centro.tipo)}</Badge>
          {!centro.activo && (
            <Badge variant="secondary" className="bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400">Inactivo</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Movimientos</p>
            <p className="text-xl font-bold">{centro.cant_movimientos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-xl font-bold font-mono text-success-600 dark:text-success-400">
              {formatMoney(Number(centro.total_ingresos))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Egresos</p>
            <p className="text-xl font-bold font-mono text-error-600 dark:text-error-400">
              {formatMoney(Number(centro.total_egresos))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Neto</p>
            <p className={`text-xl font-bold font-mono ${Number(centro.neto) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
              {formatMoney(Number(centro.neto))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="movimientos" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="movimientos">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Movimientos</span>
            {centro.cant_movimientos > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{centro.cant_movimientos}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="productos">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
            {centro.cant_productos > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{centro.cant_productos}</Badge>
            )}
          </TabsTrigger>
          {centro.cant_subcentros > 0 && (
            <TabsTrigger value="subcentros">
              <FolderTree className="h-4 w-4" />
              <span className="hidden sm:inline">Sub-centros</span>
              <Badge variant="secondary" className="ml-1 text-xs">{centro.cant_subcentros}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="config">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        {/* Movimientos */}
        <TabsContent value="movimientos" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filtroTipoMov} onValueChange={(val) => setFiltroTipoMov(val ?? 'todos')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="egreso">Egresos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {movimientos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No hay movimientos asignados a este centro</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Persona/Entidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((m) => {
                    const caja = m.cajas?.[0]
                    const persona = m.personas?.[0]
                    return (
                      <TableRow key={m.id} className={m.anulado ? 'opacity-50 line-through' : ''}>
                        <TableCell className="text-sm">
                          {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            m.tipo === 'ingreso'
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                              : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                          }>
                            {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatMoney(m.monto_neto)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {persona ? `${persona.apellido}, ${persona.nombre}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {m.descripcion ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.comprobante_numero ?? '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Productos */}
        <TabsContent value="productos" className="mt-4">
          {productos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No hay productos asignados a este centro</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-sm">{p.tipo}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatMoney(p.precio_base)}</TableCell>
                      <TableCell>
                        {p.activo
                          ? <Badge variant="secondary" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</Badge>
                          : <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400">Inactivo</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Sub-centros */}
        {centro.cant_subcentros > 0 && (
          <TabsContent value="subcentros" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Movimientos</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcentros.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/finanzas/centros-costo/${s.id}`)}
                    >
                      <TableCell><Badge variant="outline" className="font-mono">{s.codigo ?? '-'}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{s.nombre}</TableCell>
                      <TableCell className="text-sm">{tipoLabel(s.tipo)}</TableCell>
                      <TableCell className="text-right text-sm">{s.cant_movimientos}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatMoney(Number(s.neto))}</TableCell>
                      <TableCell>
                        {s.activo
                          ? <Badge variant="secondary" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</Badge>
                          : <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400">Inactivo</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* Configuración */}
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={centro.codigo ?? ''} disabled className="font-mono" />
                  <p className="text-xs text-muted-foreground">No editable</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={editTipo} onValueChange={(val) => setEditTipo(val ?? editTipo)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Centro padre</Label>
                  <Select value={editPadreId || '_none'} onValueChange={(val) => setEditPadreId(val === '_none' ? '' : (val ?? ''))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ninguno (raíz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Ninguno (raíz)</SelectItem>
                      {centrosPadreOptions.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.codigo ? `${c.codigo} — ` : ''}{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Opcional"
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={isPending || !editNombre.trim()}>
                  {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
