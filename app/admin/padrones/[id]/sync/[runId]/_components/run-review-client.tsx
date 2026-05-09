'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  obtenerRowsDeRun,
  listarEquiposPendientesPorRun,
  aprobarEquipoPendiente,
  aprobarTodosEquiposPorRun,
  rechazarEquipoPendiente,
  resolverCandidato,
  resolverBulk,
  aplicarRun,
} from '@/lib/imports/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  Check,
  X,
  UserPlus,
  ChevronDown,
  Play,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

interface ImportRow {
  id: string
  numero_fila: number
  raw_data: Record<string, string>
  parsed_data: Record<string, unknown>
  match_status: string
  match_score: number | null
  match_type: string | null
  persona_id: string | null
  candidatos: { persona_id: string; score: number; snapshot: Record<string, unknown> }[]
  apply_status: string
  apply_notas: string | null
  apply_error: string | null
}

interface PendingTeam {
  equipo_id: string
  nombre: string
  disciplina_slug: string
  filas_count: number
}

interface Props {
  runId: string
  padronId: string
  estado: string
  conteos: Record<string, number>
  pipelineSlug: string
}

const matchStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  exacto: { label: 'Exacto', variant: 'default' },
  auto_fuzzy: { label: 'Auto-fuzzy', variant: 'default' },
  revisar: { label: 'Revisar', variant: 'outline' },
  sin_match: { label: 'Sin match', variant: 'destructive' },
  manual_review: { label: 'Manual', variant: 'outline' },
  aplicado: { label: 'Aplicado', variant: 'default' },
  descartado: { label: 'Descartado', variant: 'secondary' },
  error: { label: 'Error', variant: 'destructive' },
}

export function RunReviewClient({ runId, padronId, estado, conteos }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rows, setRows] = useState<ImportRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterMatch, setFilterMatch] = useState<string>('')
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([])
  const [message, setMessage] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRows = useCallback(async () => {
    setLoading(true)
    const result = await obtenerRowsDeRun(runId, {
      matchStatus: filterMatch || undefined,
      page,
      pageSize: 50,
    })
    setRows(result.rows as unknown as ImportRow[])
    setTotal(result.total)
    setLoading(false)
  }, [runId, filterMatch, page])

  const loadTeams = useCallback(async () => {
    if ((conteos.apply_pendiente_revision_equipo ?? 0) > 0) {
      const teams = await listarEquiposPendientesPorRun(runId)
      setPendingTeams(teams as PendingTeam[])
    }
  }, [runId, conteos.apply_pendiente_revision_equipo])

  useEffect(() => {
    loadRows()
    loadTeams()
  }, [loadRows, loadTeams])

  function handleResolve(rowId: string, decision: 'aceptar_top' | 'crear_nueva' | 'descartar') {
    startTransition(async () => {
      const result = await resolverCandidato(rowId, decision)
      setMessage(result.message)
      await loadRows()
    })
  }

  function handleBulkResolve(matchStatus: string, decision: 'aceptar_top' | 'crear_nueva' | 'descartar') {
    startTransition(async () => {
      const result = await resolverBulk(runId, matchStatus, decision)
      setMessage(result.message)
      await loadRows()
      router.refresh()
    })
  }

  function handleApproveTeam(equipoId: string) {
    startTransition(async () => {
      await aprobarEquipoPendiente(equipoId)
      await loadTeams()
      router.refresh()
    })
  }

  function handleRejectTeam(equipoId: string) {
    startTransition(async () => {
      await rechazarEquipoPendiente(equipoId, { filasAccion: 'descartar' })
      await loadTeams()
      router.refresh()
    })
  }

  function handleApproveAllTeams() {
    startTransition(async () => {
      await aprobarTodosEquiposPorRun(runId)
      await loadTeams()
      router.refresh()
    })
  }

  function handleApply() {
    startTransition(async () => {
      const result = await aplicarRun(runId)
      setMessage(result.message)
      router.refresh()
    })
  }

  const totalPages = Math.ceil(total / 50)
  const hayPorRevisar = (conteos.revisar ?? 0) > 0
  const hayPendienteEquipo = (conteos.apply_pendiente_revision_equipo ?? 0) > 0
  const puedeAplicar = estado === 'revisando' && !hayPendienteEquipo

  return (
    <div className="space-y-4">
      {/* Pending teams section */}
      {pendingTeams.length > 0 && (
        <div className="border rounded-md p-4 bg-amber-50 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">Equipos pendientes de aprobacion</h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleApproveAllTeams} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprobar todos
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pendingTeams.map((team) => (
              <div key={team.equipo_id} className="border rounded-md p-3 bg-background flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{team.nombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.disciplina_slug} &middot; {team.filas_count} jugadores
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleApproveTeam(team.equipo_id)} disabled={isPending}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRejectTeam(team.equipo_id)} disabled={isPending}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {hayPorRevisar && estado === 'revisando' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Acciones masivas para &quot;a revisar&quot;:</span>
          <Button variant="outline" size="sm" onClick={() => handleBulkResolve('revisar', 'aceptar_top')} disabled={isPending}>
            <ShieldCheck className="h-4 w-4 mr-1" />
            Aceptar todos (top)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkResolve('revisar', 'crear_nueva')} disabled={isPending}>
            <UserPlus className="h-4 w-4 mr-1" />
            Crear nuevas
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkResolve('revisar', 'descartar')} disabled={isPending}>
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: '', label: `Todos (${total})` },
          { value: 'exacto', label: `Exactos (${conteos.exacto ?? 0})` },
          { value: 'auto_fuzzy', label: `Auto (${conteos.auto_fuzzy ?? 0})` },
          { value: 'revisar', label: `Revisar (${conteos.revisar ?? 0})` },
          { value: 'sin_match', label: `Sin match (${conteos.sin_match ?? 0})` },
        ].map((f) => (
          <Badge
            key={f.value}
            variant={filterMatch === f.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => { setFilterMatch(f.value); setPage(1) }}
          >
            {f.label}
          </Badge>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="text-sm p-3 rounded-md bg-muted">{message}</div>
      )}

      {/* Rows table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay filas{filterMatch ? ` con estado "${filterMatch}"` : ''}.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Match con</TableHead>
                <TableHead>Apply</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const pd = row.parsed_data ?? {}
                const displayName = [pd.apellido, pd.nombre].filter(Boolean).join(', ') || (pd.nombre_completo as string) || '-'
                const topCandidate = row.candidatos?.[0]
                const candidateSnap = topCandidate?.snapshot
                const isExpanded = expandedRow === row.id
                const ms = matchStatusLabels[row.match_status] ?? { label: row.match_status, variant: 'secondary' as const }

                return (
                  <>
                    <TableRow key={row.id} className={row.apply_status === 'descartado' ? 'opacity-50' : ''}>
                      <TableCell className="tabular-nums text-muted-foreground">{row.numero_fila}</TableCell>
                      <TableCell className="font-medium">{displayName as string}</TableCell>
                      <TableCell>
                        <Badge variant={ms.variant}>{ms.label}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.match_score != null ? `${Math.round(row.match_score * 100)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {candidateSnap
                          ? `${candidateSnap.apellido ?? ''} ${candidateSnap.nombre ?? ''}`
                          : row.persona_id ? row.persona_id.slice(0, 8) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.apply_status === 'aplicado' ? 'default' : row.apply_status === 'fallado' ? 'destructive' : 'secondary'}>
                          {row.apply_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {row.match_status === 'revisar' && row.apply_status === 'pendiente' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResolve(row.id, 'aceptar_top')} disabled={isPending} title="Aceptar top">
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResolve(row.id, 'crear_nueva')} disabled={isPending} title="Crear nueva">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResolve(row.id, 'descartar')} disabled={isPending} title="Descartar">
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {row.candidatos?.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedRow(isExpanded ? null : row.id)} title="Ver candidatos">
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && row.candidatos?.length > 0 && (
                      <TableRow key={`${row.id}-exp`}>
                        <TableCell colSpan={7} className="bg-muted/50 p-3">
                          <div className="text-xs space-y-1">
                            <div className="font-medium mb-1">Candidatos:</div>
                            {row.candidatos.map((c, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="tabular-nums text-muted-foreground">{Math.round(c.score * 100)}%</span>
                                <span>{String(c.snapshot?.apellido ?? '')} {String(c.snapshot?.nombre ?? '')}</span>
                                <span className="text-muted-foreground">DNI: {String(c.snapshot?.numero_documento ?? '-')}</span>
                                {row.match_status === 'revisar' && row.apply_status === 'pendiente' && (
                                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                                    startTransition(async () => {
                                      await resolverCandidato(row.id, 'aceptar_personaId', { personaId: c.persona_id })
                                      await loadRows()
                                    })
                                  }} disabled={isPending}>
                                    Seleccionar
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          {row.apply_error && (
                            <div className="text-xs text-destructive mt-2">Error: {row.apply_error}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages} ({total} filas)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Apply button */}
      {puedeAplicar && (
        <div className="border-t pt-4">
          <Button onClick={handleApply} disabled={isPending} className="w-full sm:w-auto">
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Aplicar importacion</>
            )}
          </Button>
        </div>
      )}

      {/* Re-apply after team approval */}
      {hayPendienteEquipo && pendingTeams.length === 0 && estado === 'revisando' && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Todos los equipos fueron aprobados. Podés re-aplicar para procesar las filas pendientes.
          </p>
          <Button onClick={handleApply} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Re-aplicando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Re-aplicar filas pendientes</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
