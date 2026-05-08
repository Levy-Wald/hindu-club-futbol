'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, UserMinus, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, Loader2, Search, Download, Pencil,
  Check, X, MoreHorizontal, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  obtenerDiffIdsParaAplicar, aplicarSyncBatch, finalizarSync,
  obtenerProgresoSync,
  rollbackSync, actualizarEstadoRevision, editarDiff,
} from '../../_actions'

// ============================================================
// Types
// ============================================================
interface SyncRecord {
  id: string
  padron_id: string
  archivo_origen: string
  estado: string
  total_filas_archivo: number
  altas_count: number
  bajas_count: number
  cambios_count: number
  sin_cambios_count: number
  rechazados_count: number
  fecha_sync: string
  error_mensaje: string | null
}

interface DiffRecord {
  id: string
  sync_id: string
  persona_id: string | null
  tipo_cambio: string
  dni_archivo: string | null
  nombre_archivo: string | null
  nombre_confianza: string | null
  numero_socio_archivo: string | null
  categoria_archivo: string | null
  actividad_archivo: string | null
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  motivo_rechazo: string | null
  aplicado: boolean
  estado_revision: string
  notas: string | null
  razon_descarte: string | null
}

type TabKey = 'altas' | 'bajas' | 'cambios' | 'rechazados' | 'sin_cambios'

const TAB_CONFIG: Record<TabKey, { tipo: string; label: string; icon: React.ReactNode; color: string }> = {
  altas: { tipo: 'alta', label: 'Altas', icon: <UserPlus className="h-4 w-4" />, color: 'text-green-600' },
  bajas: { tipo: 'baja', label: 'Bajas', icon: <UserMinus className="h-4 w-4" />, color: 'text-red-600' },
  cambios: { tipo: 'modificacion', label: 'Cambios', icon: <RefreshCw className="h-4 w-4" />, color: 'text-yellow-600' },
  rechazados: { tipo: 'rechazado', label: 'Rechazados', icon: <XCircle className="h-4 w-4" />, color: 'text-orange-600' },
  sin_cambios: { tipo: 'sin_cambios', label: 'Sin cambios', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-muted-foreground' },
}

const PAGE_SIZE = 50

// ============================================================
// Main Component
// ============================================================
export function RevisarSyncClient({ sync, diffs: initialDiffs }: { sync: SyncRecord; diffs: DiffRecord[] }) {
  const router = useRouter()
  const [diffs, setDiffs] = useState(initialDiffs)
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (initialDiffs.some((d) => d.tipo_cambio === 'alta')) return 'altas'
    if (initialDiffs.some((d) => d.tipo_cambio === 'modificacion')) return 'cambios'
    return 'altas'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [editingDiff, setEditingDiff] = useState<DiffRecord | null>(null)
  const [sortField, setSortField] = useState<string>('nombre_archivo')
  const [sortAsc, setSortAsc] = useState(true)
  const [filterRevision, setFilterRevision] = useState<string>('todos')
  const [filterConfianza, setFilterConfianza] = useState<string>('todos')
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number } | null>(null)
  const [dryRun, setDryRun] = useState(false)
  const DRY_RUN_LIMIT = 50

  const puedeAplicar = sync.estado === 'preview' || sync.estado === 'revisado' || sync.estado === 'preview_parcial'
  const puedeRollback = sync.estado === 'aplicado'

  // Counts per tab
  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { altas: 0, bajas: 0, cambios: 0, rechazados: 0, sin_cambios: 0 }
    for (const d of diffs) {
      if (d.tipo_cambio === 'alta') c.altas++
      else if (d.tipo_cambio === 'baja') c.bajas++
      else if (d.tipo_cambio === 'modificacion') c.cambios++
      else if (d.tipo_cambio === 'rechazado') c.rechazados++
      else if (d.tipo_cambio === 'sin_cambios') c.sin_cambios++
    }
    return c
  }, [diffs])

  // Review stats
  const reviewStats = useMemo(() => {
    const actionable = diffs.filter((d) => ['alta', 'baja', 'modificacion'].includes(d.tipo_cambio))
    return {
      aprobados: actionable.filter((d) => d.estado_revision === 'aprobado' || d.estado_revision === 'editado').length,
      pendientes: actionable.filter((d) => d.estado_revision === 'pendiente').length,
      descartados: actionable.filter((d) => d.estado_revision === 'descartado').length,
      pospuestos: actionable.filter((d) => d.estado_revision === 'pospuesto').length,
      total: actionable.length,
    }
  }, [diffs])

  // Filtered + sorted diffs for current tab
  const tabDiffs = useMemo(() => {
    const tipoFilter = TAB_CONFIG[activeTab].tipo
    let filtered = diffs.filter((d) => d.tipo_cambio === tipoFilter)

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((d) =>
        (d.nombre_archivo?.toLowerCase().includes(q)) ||
        (d.dni_archivo?.toLowerCase().includes(q)) ||
        (d.numero_socio_archivo?.toLowerCase().includes(q)) ||
        (d.categoria_archivo?.toLowerCase().includes(q)) ||
        (d.actividad_archivo?.toLowerCase().includes(q))
      )
    }

    // Filter by revision state
    if (filterRevision !== 'todos') {
      filtered = filtered.filter((d) => d.estado_revision === filterRevision)
    }

    // Filter by nombre_confianza
    if (filterConfianza !== 'todos') {
      filtered = filtered.filter((d) => d.nombre_confianza === filterConfianza)
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortField] ?? '')
      const bVal = String((b as unknown as Record<string, unknown>)[sortField] ?? '')
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

    return filtered
  }, [diffs, activeTab, searchQuery, filterRevision, filterConfianza, sortField, sortAsc])

  // Pagination
  const totalPages = Math.ceil(tabDiffs.length / PAGE_SIZE)
  const pageDiffs = tabDiffs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when tab/search changes
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    setPage(0)
    setSelected(new Set())
    setSearchQuery('')
    setFilterRevision('todos')
    setFilterConfianza('todos')
  }, [])

  // Selection
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectPage() {
    const pageIds = pageDiffs.map((d) => d.id)
    const allSelected = pageIds.every((id) => selected.has(id))
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function selectAllFiltered() {
    setSelected(new Set(tabDiffs.map((d) => d.id)))
  }

  // Sort
  function handleSort(field: string) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Bulk actions
  async function handleBulkRevision(estado: 'aprobado' | 'descartado' | 'pospuesto' | 'pendiente') {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setLoading(true)
    const result = await actualizarEstadoRevision(ids, estado)
    setLoading(false)
    if (result.success) {
      setDiffs((prev) => prev.map((d) =>
        ids.includes(d.id) ? { ...d, estado_revision: estado } : d
      ))
      setSelected(new Set())
      toast.success(`${result.count} registros marcados como ${estado}`)
    }
  }

  // Single row action
  async function handleRowRevision(id: string, estado: 'aprobado' | 'descartado' | 'pospuesto' | 'pendiente') {
    const result = await actualizarEstadoRevision([id], estado)
    if (result.success) {
      setDiffs((prev) => prev.map((d) => d.id === id ? { ...d, estado_revision: estado } : d))
    }
  }

  // Edit diff
  async function handleSaveEdit(diffId: string, updates: Record<string, unknown>) {
    setLoading(true)
    const result = await editarDiff(diffId, updates)
    setLoading(false)
    if (result.success) {
      setDiffs((prev) => prev.map((d) =>
        d.id === diffId ? { ...d, ...updates, estado_revision: 'editado' } : d
      ))
      setEditingDiff(null)
      toast.success('Registro editado')
    } else {
      toast.error(result.error)
    }
  }

  // Apply (batched to avoid Vercel 60s timeout)
  const APPLY_BATCH_SIZE = 200

  async function handleAplicar(soloAprobados: boolean) {
    const label = soloAprobados ? 'aprobados' : 'todos los pendientes'
    const count = soloAprobados ? reviewStats.aprobados : reviewStats.aprobados + reviewStats.pendientes
    const efectivo = dryRun ? Math.min(count, DRY_RUN_LIMIT) : count
    const dryLabel = dryRun ? ` (prueba: primeros ${DRY_RUN_LIMIT})` : ''
    if (!confirm(`Aplicar ${efectivo} cambios (${label})${dryLabel}? Se van a crear personas, dar bajas y actualizar datos.`)) return

    setLoading(true)
    try {
      const idsResult = await obtenerDiffIdsParaAplicar(sync.id, soloAprobados)
      if (idsResult.error || !idsResult.ids) {
        toast.error(idsResult.error ?? 'Error obteniendo diffs')
        setLoading(false)
        return
      }

      const allIds = dryRun ? idsResult.ids.slice(0, DRY_RUN_LIMIT) : idsResult.ids
      const totalReal = allIds.length
      setImportProgress({ processed: 0, total: totalReal })

      // Polling: cada 3s leer progreso real de la DB
      const pollInterval = setInterval(async () => {
        try {
          const { aplicados } = await obtenerProgresoSync(sync.id)
          setImportProgress((prev) => prev ? { ...prev, processed: aplicados } : null)
        } catch { /* ignore polling errors */ }
      }, 3000)

      let totalAplicados = 0
      let totalErrores = 0

      try {
        for (let i = 0; i < allIds.length; i += APPLY_BATCH_SIZE) {
          const batch = allIds.slice(i, i + APPLY_BATCH_SIZE)
          const result = await aplicarSyncBatch(sync.id, batch)
          if (result.error) {
            toast.error(result.error)
            break
          }
          totalAplicados += result.aplicados ?? 0
          totalErrores += result.errores ?? 0
        }
      } finally {
        clearInterval(pollInterval)
      }

      // Update final con número real
      setImportProgress({ processed: totalReal, total: totalReal })

      await finalizarSync(sync.id, totalAplicados, totalErrores, dryRun)
      if (dryRun) {
        toast.success(`Prueba completada: ${totalAplicados} de ${DRY_RUN_LIMIT} aplicados. Validá en DB y luego aplicá el resto.`)
      } else {
        toast.success(`Sync aplicada: ${totalAplicados} cambios, ${totalErrores} errores`)
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error aplicando sync')
    } finally {
      setLoading(false)
      setImportProgress(null)
    }
  }

  // Rollback
  async function handleRollback() {
    if (!confirm('Revertir TODOS los cambios de esta sincronización?')) return
    setLoading(true)
    const result = await rollbackSync(sync.id)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success(`Rollback: ${result.revertidos} cambios revertidos`)
      router.refresh()
    }
  }

  // Export CSV
  function exportCSV() {
    const headers = ['Nombre', 'DNI', 'Nro Socio', 'Categoria', 'Actividad', 'Estado Revision', 'Motivo Rechazo']
    const rows = tabDiffs.map((d) => [
      d.nombre_archivo ?? '', d.dni_archivo ?? '', d.numero_socio_archivo ?? '',
      d.categoria_archivo ?? '', d.actividad_archivo ?? '', d.estado_revision,
      d.motivo_rechazo ?? '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sync-${activeTab}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin/padrones/sincronizar">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{sync.archivo_origen}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(sync.fecha_sync).toLocaleDateString('es-AR')} — {sync.total_filas_archivo} filas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EstadoBadge estado={sync.estado} />
          {puedeAplicar && (
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              Probar con {DRY_RUN_LIMIT}
            </label>
          )}
          {puedeAplicar && reviewStats.aprobados > 0 && (
            <Button size="sm" variant="outline" onClick={() => handleAplicar(true)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Aplicar aprobados ({reviewStats.aprobados})
            </Button>
          )}
          {puedeAplicar && (
            <Button size="sm" onClick={() => handleAplicar(false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {dryRun ? `Probar ${DRY_RUN_LIMIT}` : 'Aplicar todo'}
            </Button>
          )}
          {puedeRollback && (
            <Button size="sm" variant="destructive" onClick={handleRollback} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-1" /> Rollback
            </Button>
          )}
        </div>
      </div>

      {sync.error_mensaje && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/5 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          {sync.error_mensaje}
        </div>
      )}

      {/* Review progress bar */}
      {puedeAplicar && (
        <div className="flex items-center gap-4 px-4 py-2 rounded-md border bg-muted/30 text-sm">
          <span className="font-medium">Revisión:</span>
          <span className="text-green-600">{reviewStats.aprobados} aprobados</span>
          <span className="text-muted-foreground">{reviewStats.pendientes} pendientes</span>
          <span className="text-red-500">{reviewStats.descartados} descartados</span>
          {reviewStats.pospuestos > 0 && <span className="text-yellow-600">{reviewStats.pospuestos} pospuestos</span>}
        </div>
      )}

      {/* Stat cards — clickeable */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.entries(TAB_CONFIG) as [TabKey, typeof TAB_CONFIG[TabKey]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors',
              activeTab === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
            )}
          >
            <div className={cn('flex items-center gap-1.5', cfg.color)}>
              {cfg.icon}
              <span className="text-2xl font-bold">{counts[key]}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Table toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI, socio..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
            className="pl-9 h-9"
          />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={filterRevision}
          onChange={(e) => { setFilterRevision(e.target.value); setPage(0) }}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobados</option>
          <option value="editado">Editados</option>
          <option value="descartado">Descartados</option>
          <option value="pospuesto">Pospuestos</option>
        </select>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={filterConfianza}
          onChange={(e) => { setFilterConfianza(e.target.value); setPage(0) }}
        >
          <option value="todos">Confianza nombre</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja - Revisar</option>
        </select>
        <Button variant="ghost" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          {tabDiffs.length} resultado{tabDiffs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-md border bg-primary/5 border-primary/20 flex-wrap">
          <span className="text-sm font-medium">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
          {selected.size < tabDiffs.length && (
            <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={selectAllFiltered}>
              Seleccionar todos ({tabDiffs.length})
            </Button>
          )}
          <div className="flex-1" />
          {activeTab !== 'sin_cambios' && (
            <>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => handleBulkRevision('aprobado')}>
                <Check className="h-3 w-3 mr-1" /> Aprobar
              </Button>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => handleBulkRevision('descartado')}>
                <X className="h-3 w-3 mr-1" /> Descartar
              </Button>
              {activeTab === 'bajas' && (
                <Button size="sm" variant="outline" disabled={loading} onClick={() => handleBulkRevision('pospuesto')}>
                  <Clock className="h-3 w-3 mr-1" /> Posponer
                </Button>
              )}
              <Button size="sm" variant="ghost" disabled={loading} onClick={() => handleBulkRevision('pendiente')}>
                Reset
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Progress bar */}
      {importProgress && importProgress.total > 0 && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Aplicando cambios...</span>
            <span className="text-muted-foreground">
              {importProgress.processed} / {importProgress.total}
            </span>
          </div>
          <Progress value={(importProgress.processed / importProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            No cierres ni recargues esta página hasta que termine.
          </p>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={pageDiffs.length > 0 && pageDiffs.every((d) => selected.has(d.id))}
                      onChange={toggleSelectPage}
                      className="rounded"
                    />
                  </TableHead>
                  <SortableHead field="nombre_archivo" label="Nombre" current={sortField} asc={sortAsc} onSort={handleSort} />
                  <SortableHead field="dni_archivo" label="DNI" current={sortField} asc={sortAsc} onSort={handleSort} />
                  <SortableHead field="numero_socio_archivo" label="Nro. Socio" current={sortField} asc={sortAsc} onSort={handleSort} />
                  <SortableHead field="categoria_archivo" label="Categoría" current={sortField} asc={sortAsc} onSort={handleSort} />
                  <SortableHead field="actividad_archivo" label="Actividad" current={sortField} asc={sortAsc} onSort={handleSort} />
                  {activeTab === 'cambios' && <TableHead>Cambios</TableHead>}
                  {activeTab === 'rechazados' && <TableHead>Motivo</TableHead>}
                  <TableHead>Revisión</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageDiffs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'Sin resultados para esa búsqueda' : 'No hay registros en esta categoría'}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageDiffs.map((d) => (
                    <TableRow key={d.id} className={cn(selected.has(d.id) && 'bg-primary/5')}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        <span className="flex items-center gap-1.5">
                          {d.persona_id ? (
                            <Link href={`/admin/personas/${d.persona_id}`} className="hover:underline">
                              {d.nombre_archivo}
                            </Link>
                          ) : d.nombre_archivo}
                          {d.nombre_confianza && d.nombre_confianza !== 'alta' && (
                            <Badge
                              variant={d.nombre_confianza === 'baja' ? 'destructive' : 'secondary'}
                              className="text-[9px] px-1 py-0 shrink-0"
                            >
                              {(d.datos_despues as Record<string, unknown>)?.posible_juridica
                                ? 'Razón social?'
                                : d.nombre_confianza === 'baja' ? 'Revisar nombre' : 'Nombre?'}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.dni_archivo ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.numero_socio_archivo ?? '-'}</TableCell>
                      <TableCell className="text-xs">{d.categoria_archivo ?? '-'}</TableCell>
                      <TableCell className="text-xs">{d.actividad_archivo ?? '-'}</TableCell>
                      {activeTab === 'cambios' && (
                        <TableCell><DiffDetail antes={d.datos_antes} despues={d.datos_despues} /></TableCell>
                      )}
                      {activeTab === 'rechazados' && (
                        <TableCell className="text-xs text-destructive max-w-[200px]">{d.motivo_rechazo}</TableCell>
                      )}
                      <TableCell><RevisionBadge estado={d.estado_revision} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingDiff(d)}>
                              <Pencil className="h-3 w-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            {d.estado_revision !== 'aprobado' && (
                              <DropdownMenuItem onClick={() => handleRowRevision(d.id, 'aprobado')}>
                                <Check className="h-3 w-3 mr-2" /> Aprobar
                              </DropdownMenuItem>
                            )}
                            {d.estado_revision !== 'descartado' && (
                              <DropdownMenuItem onClick={() => handleRowRevision(d.id, 'descartado')}>
                                <X className="h-3 w-3 mr-2" /> Descartar
                              </DropdownMenuItem>
                            )}
                            {activeTab === 'bajas' && d.estado_revision !== 'pospuesto' && (
                              <DropdownMenuItem onClick={() => handleRowRevision(d.id, 'pospuesto')}>
                                <Clock className="h-3 w-3 mr-2" /> Posponer
                              </DropdownMenuItem>
                            )}
                            {d.estado_revision !== 'pendiente' && (
                              <DropdownMenuItem onClick={() => handleRowRevision(d.id, 'pendiente')}>
                                <RotateCcw className="h-3 w-3 mr-2" /> Reset
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} ({tabDiffs.length} registros)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editingDiff && (
        <EditDiffDialog
          diff={editingDiff}
          activeTab={activeTab}
          onSave={handleSaveEdit}
          onClose={() => setEditingDiff(null)}
          loading={loading}
        />
      )}
    </>
  )
}

// ============================================================
// Sub-components
// ============================================================
function SortableHead({ field, label, current, asc, onSort }: {
  field: string; label: string; current: string; asc: boolean; onSort: (f: string) => void
}) {
  return (
    <TableHead>
      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort(field)}>
        {label}
        {current === field && <span className="text-[10px]">{asc ? '▲' : '▼'}</span>}
      </button>
    </TableHead>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'preview': return <Badge variant="secondary">Preview</Badge>
    case 'preview_parcial': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Preview parcial</Badge>
    case 'aplicado': return <Badge variant="default">Aplicado</Badge>
    case 'rollback': return <Badge variant="destructive">Rollback</Badge>
    case 'fallado': return <Badge variant="destructive">Fallado</Badge>
    default: return <Badge variant="outline">{estado}</Badge>
  }
}

function RevisionBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'aprobado': return <Badge variant="default" className="text-[10px] bg-green-600">Aprobado</Badge>
    case 'editado': return <Badge variant="default" className="text-[10px] bg-blue-600">Editado</Badge>
    case 'descartado': return <Badge variant="destructive" className="text-[10px]">Descartado</Badge>
    case 'pospuesto': return <Badge variant="secondary" className="text-[10px]">Pospuesto</Badge>
    case 'pendiente': return <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
    default: return <Badge variant="outline" className="text-[10px]">{estado}</Badge>
  }
}

function DiffDetail({ antes, despues }: { antes: Record<string, unknown> | null; despues: Record<string, unknown> | null }) {
  if (!despues) return <span className="text-xs text-muted-foreground">-</span>
  const campos = Object.keys(despues)
  return (
    <div className="space-y-0.5">
      {campos.map((campo) => (
        <div key={campo} className="text-[11px]">
          <span className="font-medium">{campo}:</span>{' '}
          <span className="text-red-500 line-through">{String(antes?.[campo] ?? '∅')}</span>
          {' → '}
          <span className="text-green-600">{String(despues[campo])}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Edit Dialog
// ============================================================
function EditDiffDialog({ diff, activeTab, onSave, onClose, loading }: {
  diff: DiffRecord
  activeTab: TabKey
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const [nombre, setNombre] = useState(diff.nombre_archivo ?? '')
  const [dni, setDni] = useState(diff.dni_archivo ?? '')
  const [nroSocio, setNroSocio] = useState(diff.numero_socio_archivo ?? '')
  const [categoria, setCategoria] = useState(diff.categoria_archivo ?? '')
  const [actividad, setActividad] = useState(diff.actividad_archivo ?? '')
  const [motivo, setMotivo] = useState(diff.motivo_rechazo ?? '')

  // datos_despues fields for altas
  const datos = (diff.datos_despues ?? {}) as Record<string, string>
  const [apellido, setApellido] = useState(datos.apellido ?? '')
  const [nombrePersona, setNombrePersona] = useState(datos.nombre ?? '')
  const [fechaNac, setFechaNac] = useState(datos.fecha_nacimiento ?? '')
  const [fechaIngreso, setFechaIngreso] = useState(datos.fecha_ingreso_club ?? '')

  async function handleSubmit() {
    const updates: Record<string, unknown> = {
      nombre_archivo: nombre,
      dni_archivo: dni,
      numero_socio_archivo: nroSocio,
      categoria_archivo: categoria,
      actividad_archivo: actividad,
    }

    if (activeTab === 'rechazados') {
      // If DNI was fixed, move to 'alta'
      const dniClean = dni.replace(/[\.\-\s]/g, '').trim()
      if (dniClean && dniClean.length >= 6 && dniClean.length <= 11) {
        updates.tipo_cambio = 'alta'
        updates.motivo_rechazo = null
        updates.dni_archivo = dniClean
      } else {
        updates.motivo_rechazo = motivo || diff.motivo_rechazo
      }
    }

    if (activeTab === 'altas' || (activeTab === 'rechazados' && updates.tipo_cambio === 'alta')) {
      // Split nombre if needed
      let ap = apellido
      let nm = nombrePersona
      if (!ap && !nm && nombre) {
        const parts = nombre.split(/\s+/)
        ap = parts[0] || ''
        nm = parts.slice(1).join(' ') || ''
      }
      updates.datos_despues = {
        ...datos,
        nombre: nm,
        apellido: ap,
        numero_documento: (updates.dni_archivo as string) || dni,
        fecha_nacimiento: fechaNac || null,
        numero_socio: nroSocio,
        categoria_club: categoria,
        actividad_club: actividad,
        fecha_ingreso_club: fechaIngreso || null,
      }
    }

    if (activeTab === 'cambios' && diff.datos_despues) {
      updates.datos_despues = {
        ...diff.datos_despues,
        ...(categoria !== diff.categoria_archivo ? { categoria_club: categoria } : {}),
        ...(actividad !== diff.actividad_archivo ? { actividad_club: actividad } : {}),
        ...(nroSocio !== diff.numero_socio_archivo ? { numero_socio: nroSocio } : {}),
      }
    }

    await onSave(diff.id, updates)
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {(activeTab === 'altas' || activeTab === 'rechazados') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Apellido</Label>
                <Input value={apellido} onChange={(e) => setApellido(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input value={nombrePersona} onChange={(e) => setNombrePersona(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Nombre completo (archivo)</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">DNI</Label>
              <Input value={dni} onChange={(e) => setDni(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nro. Socio</Label>
              <Input value={nroSocio} onChange={(e) => setNroSocio(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Actividad</Label>
              <Input value={actividad} onChange={(e) => setActividad(e.target.value)} />
            </div>
          </div>
          {(activeTab === 'altas' || activeTab === 'rechazados') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fecha nacimiento</Label>
                <Input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha ingreso</Label>
                <Input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
              </div>
            </div>
          )}
          {activeTab === 'rechazados' && (
            <div className="space-y-1">
              <Label className="text-xs">Motivo rechazo</Label>
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled />
              <p className="text-[11px] text-muted-foreground">Si corregís el DNI, el registro pasa automáticamente a "Altas"</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
