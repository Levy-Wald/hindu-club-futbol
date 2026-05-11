'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Download, Users, UserX, UserCheck, Link2, Unlink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { vincularBatchAPadron, desvincularBatchDePadron } from '../_actions'
import type { PadronOption, PersonaPadronRow } from '../_lib/queries'

interface ComparadorUIProps {
  padrones: PadronOption[]
  personas: PersonaPadronRow[]
  equipos: { id: string; nombre: string; disciplina_slug: string }[]
}

type CompareMode = 'padron_vs_padron' | 'padron_vs_personas' | 'padron_vs_equipos'
type FilterMode = 'en_ambos' | 'solo_a' | 'solo_b' | 'sin_padron' | 'sin_equipo' | 'todos'

export function ComparadorUI({ padrones, personas, equipos }: ComparadorUIProps) {
  const [mode, setMode] = useState<CompareMode>('padron_vs_padron')
  const [padronA, setPadronA] = useState<string>('')
  const [padronB, setPadronB] = useState<string>('')
  const [equipoId, setEquipoId] = useState<string>('')
  const [filter, setFilter] = useState<FilterMode>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  // Compute comparison results
  const results = useMemo(() => {
    if (mode === 'padron_vs_padron') {
      if (!padronA || !padronB) return null
      return comparePadronVsPadron(personas, padronA, padronB)
    }
    if (mode === 'padron_vs_personas') {
      if (!padronA) return null
      return comparePadronVsPersonas(personas, padronA)
    }
    if (mode === 'padron_vs_equipos') {
      if (!padronA) return null
      return comparePadronVsEquipos(personas, padronA, equipoId || undefined)
    }
    return null
  }, [mode, padronA, padronB, equipoId, personas])

  // Filter results
  const filteredResults = useMemo(() => {
    if (!results) return []
    if (filter === 'todos') return results.rows
    return results.rows.filter((r) => r.category === filter)
  }, [results, filter])

  const padronAName = padrones.find((p) => p.id === padronA)?.nombre ?? ''
  const padronBName = padrones.find((p) => p.id === padronB)?.nombre ?? ''

  function toggleSelect(personaId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(personaId)) next.delete(personaId)
      else next.add(personaId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filteredResults.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredResults.map((r) => r.persona_id)))
    }
  }

  async function handleVincular(targetPadronId: string) {
    if (selected.size === 0) return
    setActionLoading(true)
    try {
      const result = await vincularBatchAPadron(targetPadronId, Array.from(selected))
      if (result.ok) {
        toast.success(result.message)
        setSelected(new Set())
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al vincular')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDesvincular(targetPadronId: string) {
    if (selected.size === 0) return
    setActionLoading(true)
    try {
      const result = await desvincularBatchDePadron(targetPadronId, Array.from(selected))
      if (result.ok) {
        toast.success(result.message)
        setSelected(new Set())
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al desvincular')
    } finally {
      setActionLoading(false)
    }
  }

  function exportCSV() {
    if (!filteredResults.length) return

    const headers = ['Apellido', 'Nombre', 'DNI', 'Email', 'Estado']
    const rows = filteredResults.map((r) => [
      r.apellido,
      r.nombre,
      r.numero_documento ?? '',
      r.email_principal ?? '',
      getCategoryLabel(r.category),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparativo-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === 'padron_vs_padron' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('padron_vs_padron'); setFilter('todos') }}
        >
          Padrón vs Padrón
        </Button>
        <Button
          variant={mode === 'padron_vs_personas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('padron_vs_personas'); setFilter('todos') }}
        >
          Padrón vs Personas
        </Button>
        <Button
          variant={mode === 'padron_vs_equipos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('padron_vs_equipos'); setFilter('todos') }}
        >
          Padrón vs Equipos
        </Button>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-md border bg-muted/30">
        {/* Padrón A (always shown) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {mode === 'padron_vs_padron' ? 'Padrón A' : 'Padrón'}
          </label>
          <Select value={padronA} onValueChange={(v) => setPadronA(v ?? '')}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {padrones.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} ({p.miembros_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Padrón B (only in padron vs padron) */}
        {mode === 'padron_vs_padron' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Padrón B</label>
            <Select value={padronB} onValueChange={(v) => setPadronB(v ?? '')}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {padrones
                  .filter((p) => p.id !== padronA)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.miembros_count})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Equipo filter (only in padron vs equipos) */}
        {mode === 'padron_vs_equipos' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Equipo (opcional)</label>
            <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue placeholder="Todos los equipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los equipos</SelectItem>
                {equipos.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {results.stats.map((stat) => (
              <button
                key={stat.key}
                onClick={() => setFilter(stat.key as FilterMode)}
                className={`rounded-md border p-3 text-center transition-colors cursor-pointer ${
                  filter === stat.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className={`flex items-center justify-center gap-1 ${stat.color}`}>
                  {stat.icon}
                  <span className="text-xl font-bold">{stat.count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Filter badge */}
          {filter !== 'todos' && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getCategoryLabel(filter)}</Badge>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilter('todos')}>
                Limpiar filtro
              </Button>
            </div>
          )}

          {/* Bulk actions bar */}
          {selected.size > 0 && padronA && (
            <div className="flex items-center gap-2 p-3 rounded-md border bg-primary/5 border-primary/20">
              <span className="text-sm font-medium">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
              <div className="flex-1" />
              {mode === 'padron_vs_padron' && padronB && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleVincular(padronB)}
                  >
                    {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                    Vincular a {padronBName}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleVincular(padronA)}
                  >
                    {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                    Vincular a {padronAName}
                  </Button>
                </>
              )}
              {mode === 'padron_vs_personas' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleVincular(padronA)}
                >
                  {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                  Vincular a {padronAName}
                </Button>
              )}
              {mode === 'padron_vs_equipos' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleVincular(padronA)}
                >
                  {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                  Vincular a {padronAName}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={actionLoading}
                onClick={() => handleDesvincular(padronA)}
              >
                <Unlink className="h-3 w-3 mr-1" />
                Desvincular de {padronAName}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Cancelar
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-2 border-b bg-muted/30">
              <span className="text-xs text-muted-foreground">
                {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exportCSV}>
                <Download className="h-3 w-3 mr-1" />
                Exportar CSV
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === filteredResults.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {!padronA ? 'Seleccioná un padrón para comparar.' : 'No hay resultados.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.slice(0, 500).map((r) => (
                      <TableRow key={r.persona_id} className={selected.has(r.persona_id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(r.persona_id)}
                            onChange={() => toggleSelect(r.persona_id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/personas/${r.persona_id}`}
                            className="font-medium hover:underline"
                          >
                            {r.apellido}, {r.nombre}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.numero_documento ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{r.email_principal ?? '—'}</TableCell>
                        <TableCell>
                          <CategoryBadge category={r.category} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredResults.length > 500 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 500 de {filteredResults.length}. Exportá a CSV para ver todos.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- Comparison logic ---

interface CompareRow {
  persona_id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  category: string
}

interface CompareResult {
  rows: CompareRow[]
  stats: { key: string; label: string; count: number; color: string; icon: React.ReactNode }[]
}

function comparePadronVsPadron(
  personas: PersonaPadronRow[],
  padronAId: string,
  padronBId: string
): CompareResult {
  const rows: CompareRow[] = []

  for (const p of personas) {
    const inA = p.padron_ids.includes(padronAId)
    const inB = p.padron_ids.includes(padronBId)

    if (!inA && !inB) continue

    let category: string
    if (inA && inB) category = 'en_ambos'
    else if (inA) category = 'solo_a'
    else category = 'solo_b'

    rows.push({
      persona_id: p.persona_id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero_documento: p.numero_documento,
      email_principal: p.email_principal,
      category,
    })
  }

  const enAmbos = rows.filter((r) => r.category === 'en_ambos').length
  const soloA = rows.filter((r) => r.category === 'solo_a').length
  const soloB = rows.filter((r) => r.category === 'solo_b').length

  return {
    rows,
    stats: [
      { key: 'todos', label: 'Total', count: rows.length, color: 'text-foreground', icon: <Users className="h-4 w-4" /> },
      { key: 'en_ambos', label: 'En ambos', count: enAmbos, color: 'text-success-600', icon: <UserCheck className="h-4 w-4" /> },
      { key: 'solo_a', label: 'Solo en A', count: soloA, color: 'text-info-600', icon: <Users className="h-4 w-4" /> },
      { key: 'solo_b', label: 'Solo en B', count: soloB, color: 'text-warning-600', icon: <Users className="h-4 w-4" /> },
    ],
  }
}

function comparePadronVsPersonas(
  personas: PersonaPadronRow[],
  padronId: string
): CompareResult {
  const rows: CompareRow[] = []

  for (const p of personas) {
    const inPadron = p.padron_ids.includes(padronId)
    const category = inPadron ? 'en_ambos' : 'sin_padron'

    rows.push({
      persona_id: p.persona_id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero_documento: p.numero_documento,
      email_principal: p.email_principal,
      category,
    })
  }

  const enPadron = rows.filter((r) => r.category === 'en_ambos').length
  const sinPadron = rows.filter((r) => r.category === 'sin_padron').length

  return {
    rows,
    stats: [
      { key: 'todos', label: 'Total personas', count: rows.length, color: 'text-foreground', icon: <Users className="h-4 w-4" /> },
      { key: 'en_ambos', label: 'En el padrón', count: enPadron, color: 'text-success-600', icon: <UserCheck className="h-4 w-4" /> },
      { key: 'sin_padron', label: 'Sin este padrón', count: sinPadron, color: 'text-error-600', icon: <UserX className="h-4 w-4" /> },
    ],
  }
}

function comparePadronVsEquipos(
  personas: PersonaPadronRow[],
  padronId: string,
  equipoId?: string
): CompareResult {
  const rows: CompareRow[] = []

  for (const p of personas) {
    const inPadron = p.padron_ids.includes(padronId)
    const inEquipo = equipoId
      ? p.equipo_ids.includes(equipoId)
      : p.tiene_equipo

    if (!inPadron && !inEquipo) continue

    let category: string
    if (inPadron && inEquipo) category = 'en_ambos'
    else if (inPadron) category = 'solo_a' // in padron but not in equipo
    else category = 'solo_b' // in equipo but not in padron

    rows.push({
      persona_id: p.persona_id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero_documento: p.numero_documento,
      email_principal: p.email_principal,
      category,
    })
  }

  const enAmbos = rows.filter((r) => r.category === 'en_ambos').length
  const soloPadron = rows.filter((r) => r.category === 'solo_a').length
  const soloEquipo = rows.filter((r) => r.category === 'solo_b').length

  return {
    rows,
    stats: [
      { key: 'todos', label: 'Total', count: rows.length, color: 'text-foreground', icon: <Users className="h-4 w-4" /> },
      { key: 'en_ambos', label: 'En padrón + equipo', count: enAmbos, color: 'text-success-600', icon: <UserCheck className="h-4 w-4" /> },
      { key: 'solo_a', label: 'Solo en padrón', count: soloPadron, color: 'text-info-600', icon: <Users className="h-4 w-4" /> },
      { key: 'solo_b', label: 'Solo en equipo', count: soloEquipo, color: 'text-warning-600', icon: <UserX className="h-4 w-4" /> },
    ],
  }
}

// --- UI Helpers ---

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    en_ambos: 'En ambos',
    solo_a: 'Solo en A',
    solo_b: 'Solo en B',
    sin_padron: 'Sin padrón',
    sin_equipo: 'Sin equipo',
    todos: 'Todos',
  }
  return labels[category] ?? category
}

function CategoryBadge({ category }: { category: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    en_ambos: 'default',
    solo_a: 'outline',
    solo_b: 'secondary',
    sin_padron: 'secondary',
    sin_equipo: 'secondary',
  }

  return (
    <Badge variant={variants[category] ?? 'outline'} className="text-[10px]">
      {getCategoryLabel(category)}
    </Badge>
  )
}
