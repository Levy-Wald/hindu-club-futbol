'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Loader2,
  Search,
  FolderTree,
  List,
  ChevronRight,
  ChevronDown,
  Ban,
  RotateCcw,
  FolderPlus,
} from 'lucide-react'
import {
  listarCentrosCosto,
  crearCentroCosto,
  editarCentroCosto,
  darDeBajaCentroCosto,
  reactivarCentroCosto,
} from '../_actions'

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
  referencia_tipo: string | null
  referencia_id: string | null
  metadata: Record<string, unknown> | null
  cant_movimientos: number
  total_ingresos: number
  total_egresos: number
  neto: number
  cant_productos: number
  cant_subcentros: number
}

interface CentroForm {
  nombre: string
  codigo: string
  tipo: string
  padre_id: string
  descripcion: string
  activo: boolean
}

const EMPTY_FORM: CentroForm = {
  nombre: '',
  codigo: '',
  tipo: 'area',
  padre_id: '',
  descripcion: '',
  activo: true,
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

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

function tipoBadge(tipo: string) {
  const colors: Record<string, string> = {
    general: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400',
    area: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    disciplina: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    equipo: 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400',
    sede: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    evento: 'bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400',
    comercial: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    ingreso: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  }
  const label = TIPOS.find(t => t.value === tipo)?.label ?? tipo
  return <Badge variant="secondary" className={colors[tipo] ?? ''}>{label}</Badge>
}

type TreeNode = CentroStats & { children: TreeNode[]; depth: number }

function buildTree(centros: CentroStats[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const c of centros) {
    map.set(c.id, { ...c, children: [], depth: 0 })
  }

  for (const c of centros) {
    const node = map.get(c.id)!
    if (c.padre_id && map.has(c.padre_id)) {
      const parent = map.get(c.padre_id)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const flat: TreeNode[] = []
  function walk(nodes: TreeNode[]) {
    for (const n of nodes) {
      flat.push(n)
      walk(n.children)
    }
  }
  walk(roots)
  return flat
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function CentrosCostoClient() {
  const router = useRouter()
  const [centros, setCentros] = useState<CentroStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroActivo, setFiltroActivo] = useState('true')
  const [vistaArbol, setVistaArbol] = useState(true)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  // Form dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCodigo, setEditingCodigo] = useState<string | null>(null)
  const [form, setForm] = useState<CentroForm>(EMPTY_FORM)

  // Baja dialog
  const [bajaDialog, setBajaDialog] = useState<CentroStats | null>(null)

  async function loadData() {
    const data = await listarCentrosCosto({
      tipo: filtroTipo,
      activo: filtroActivo,
      busqueda: busqueda || undefined,
    })
    setCentros(data as unknown as CentroStats[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroActivo])

  useEffect(() => {
    const t = setTimeout(() => loadData(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  // Expand all roots by default
  useEffect(() => {
    if (centros.length > 0 && expandidos.size === 0) {
      setExpandidos(new Set(centros.filter(c => !c.padre_id).map(c => c.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centros])

  function toggleExpand(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleNew(padreId?: string) {
    setEditingId(null)
    setEditingCodigo(null)
    setForm({ ...EMPTY_FORM, padre_id: padreId ?? '' })
    setFormOpen(true)
  }

  function handleEdit(centro: CentroStats) {
    setEditingId(centro.id)
    setEditingCodigo(centro.codigo)
    setForm({
      nombre: centro.nombre,
      codigo: centro.codigo ?? '',
      tipo: centro.tipo,
      padre_id: centro.padre_id ?? '',
      descripcion: (centro.metadata as Record<string, string>)?.descripcion ?? '',
      activo: centro.activo,
    })
    setFormOpen(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      if (editingId) {
        const result = await editarCentroCosto(editingId, {
          nombre: form.nombre,
          tipo: form.tipo,
          padre_id: form.padre_id || null,
          referencia_tipo: null,
          referencia_id: null,
          descripcion: form.descripcion || null,
          activo: form.activo,
        })
        if (result.ok) {
          toast.success(result.message)
          setFormOpen(false)
          loadData()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await crearCentroCosto({
          nombre: form.nombre,
          codigo: form.codigo,
          tipo: form.tipo,
          padre_id: form.padre_id || null,
          referencia_tipo: null,
          referencia_id: null,
          descripcion: form.descripcion || null,
          activo: form.activo,
        })
        if (result.ok) {
          toast.success(result.message)
          setFormOpen(false)
          loadData()
        } else {
          toast.error(result.message)
        }
      }
    })
  }

  function handleBaja(centro: CentroStats) {
    setBajaDialog(centro)
  }

  function handleConfirmBaja() {
    if (!bajaDialog) return
    startTransition(async () => {
      const result = await darDeBajaCentroCosto(bajaDialog.id)
      if (result.ok) {
        toast.success(result.message)
        setBajaDialog(null)
        loadData()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleReactivar(id: string) {
    startTransition(async () => {
      const result = await reactivarCentroCosto(id)
      if (result.ok) {
        toast.success(result.message)
        loadData()
      } else {
        toast.error(result.message)
      }
    })
  }

  // Stats
  const activos = centros.filter(c => c.activo)
  const conMovimientos = centros.filter(c => c.cant_movimientos > 0)
  const totalNeto = centros.reduce((sum, c) => sum + Number(c.neto), 0)

  // Tree data
  const treeData = vistaArbol ? buildTree(centros) : centros.map(c => ({ ...c, children: [], depth: 0 }))

  // Centros activos para selector de padre (excluyendo el editado y sus descendientes)
  const centrosPadreOptions = centros.filter(c => c.activo && c.id !== editingId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Centros de costo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza movimientos y productos por área, disciplina o proyecto
          </p>
        </div>
        <Button onClick={() => handleNew()}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo centro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-xl font-bold">{activos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Con movimientos</p>
            <p className="text-xl font-bold">{conMovimientos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Neto total</p>
            <p className="text-xl font-bold font-mono">{formatMoney(totalNeto)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroTipo} onValueChange={(val) => setFiltroTipo(val ?? 'todos')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroActivo} onValueChange={(val) => setFiltroActivo(val ?? 'true')}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setVistaArbol(!vistaArbol)}
          title={vistaArbol ? 'Ver lista plana' : 'Ver árbol'}
        >
          {vistaArbol ? <List className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />}
        </Button>
      </div>

      {/* Tabla */}
      {centros.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderTree className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Solo tenés el centro General. Creá más centros para imputar movimientos por área, disciplina o equipo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Movimientos</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {treeData.map((centro) => {
                // In tree view, hide children of collapsed parents
                if (vistaArbol && centro.padre_id) {
                  // Check if any ancestor is collapsed
                  let parentId: string | null = centro.padre_id
                  let visible = true
                  while (parentId) {
                    if (!expandidos.has(parentId)) {
                      visible = false
                      break
                    }
                    const parent = centros.find(c => c.id === parentId)
                    parentId = parent?.padre_id ?? null
                  }
                  if (!visible) return null
                }

                const hasChildren = centro.cant_subcentros > 0 || centro.children.length > 0
                const isExpanded = expandidos.has(centro.id)

                return (
                  <TableRow
                    key={centro.id}
                    className={!centro.activo ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'}
                    onClick={() => router.push(`/admin/finanzas/centros-costo/${centro.id}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      <Badge variant="outline" className="font-mono">{centro.codigo ?? '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" style={vistaArbol ? { paddingLeft: `${centro.depth * 20}px` } : undefined}>
                        {vistaArbol && hasChildren && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(centro.id) }}
                            className="p-0.5 hover:bg-muted rounded"
                          >
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {vistaArbol && !hasChildren && <span className="w-5" />}
                        <span className="text-sm font-medium">{centro.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tipoBadge(centro.tipo)}</TableCell>
                    <TableCell className="text-right text-sm">{centro.cant_movimientos}</TableCell>
                    <TableCell className="text-right text-sm font-mono text-success-600 dark:text-success-400">
                      {Number(centro.total_ingresos) > 0 ? formatMoney(Number(centro.total_ingresos)) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-error-600 dark:text-error-400">
                      {Number(centro.total_egresos) > 0 ? formatMoney(Number(centro.total_egresos)) : '-'}
                    </TableCell>
                    <TableCell>
                      {centro.activo
                        ? <Badge variant="secondary" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</Badge>
                        : <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400">Inactivo</Badge>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" disabled={isPending} />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(centro) }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleNew(centro.id) }}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Crear sub-centro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {centro.activo ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => { e.stopPropagation(); handleBaja(centro) }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Dar de baja
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReactivar(centro.id) }}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar centro de costo' : 'Nuevo centro de costo'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Modifica los datos del centro.' : 'Crea un nuevo centro para imputar movimientos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  maxLength={20}
                  disabled={!!editingId}
                  className="font-mono uppercase"
                  placeholder="EJ: FUT"
                />
                {editingId && editingCodigo && (
                  <p className="text-xs text-muted-foreground">El código no se puede modificar</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(val) => setForm({ ...form, tipo: val ?? 'area' })}>
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
                <Select value={form.padre_id || '_none'} onValueChange={(val) => setForm({ ...form, padre_id: val === '_none' ? '' : (val ?? '') })}>
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
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Opcional"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !form.nombre.trim() || (!editingId && !form.codigo.trim())}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Dar de baja */}
      <Dialog open={!!bajaDialog} onOpenChange={(open) => { if (!open) setBajaDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja centro de costo</DialogTitle>
            <DialogDescription>
              {bajaDialog && bajaDialog.cant_movimientos > 0
                ? `Este centro tiene ${bajaDialog.cant_movimientos} movimiento(s) asignado(s). Los movimientos históricos se mantienen, pero no se podrán imputar nuevos.`
                : 'Este centro no tiene movimientos asignados. ¿Confirmás darlo de baja?'}
            </DialogDescription>
          </DialogHeader>

          {bajaDialog && (
            <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Centro:</span>
                <span className="font-medium">{bajaDialog.nombre} ({bajaDialog.codigo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Movimientos:</span>
                <span className="font-medium">{bajaDialog.cant_movimientos}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBajaDialog(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmBaja} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Dar de baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
