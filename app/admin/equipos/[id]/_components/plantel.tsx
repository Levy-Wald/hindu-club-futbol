'use client'

import { useState, useTransition, useCallback, useRef, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { SelectionBar } from '@/components/ui/selection-bar'
import { UserPlus, UserMinus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { agregarMiembro, quitarMiembro, buscarPersonas } from '../../_actions'
import type { ExportData } from '@/lib/export/formats'

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
}

interface Miembro {
  id: string
  persona_id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  fecha_inicio: string | null
  activo: boolean
  personas: Persona | null
}

interface Rol {
  slug: string
  nombre: string
  categoria: string
}

interface PlantelProps {
  equipoId: string
  miembros: Miembro[]
  roles: Rol[]
  tipo: 'jugador' | 'staff'
}

interface PersonaResult {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
}

const JUGADOR_DEFAULT_COLUMNS = ['dorsal', 'posicion', 'documento', 'fecha_inicio']
const STAFF_DEFAULT_COLUMNS = ['rol', 'documento', 'fecha_inicio']

export function Plantel({ equipoId, miembros, roles, tipo }: PlantelProps) {
  const isStaff = tipo === 'staff'
  const storageKey = isStaff ? 'equipo-staff-columns' : 'equipo-plantel-columns'
  const defaultColumns = isStaff ? STAFF_DEFAULT_COLUMNS : JUGADOR_DEFAULT_COLUMNS

  const { isVisible } = useVistasColumns(storageKey, defaultColumns)

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Search/filter state
  const [filterQuery, setFilterQuery] = useState('')
  const [filterRol, setFilterRol] = useState<string>('__all__')

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Dialog search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [rolSlug, setRolSlug] = useState('')

  // Filtered miembros
  const filteredMiembros = useMemo(() => {
    let result = miembros

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase()
      result = result.filter((m) => {
        const p = m.personas
        if (!p) return false
        const fullName = `${p.nombre} ${p.apellido}`.toLowerCase()
        const doc = p.numero_documento?.toLowerCase() ?? ''
        return fullName.includes(q) || doc.includes(q)
      })
    }

    if (filterRol !== '__all__') {
      result = result.filter((m) => m.rol_equipo_slug === filterRol)
    }

    return result
  }, [miembros, filterQuery, filterRol])

  // Available roles for filter (only those present in miembros)
  const availableRoles = useMemo(() => {
    const slugs = new Set(miembros.map((m) => m.rol_equipo_slug))
    return roles.filter((r) => slugs.has(r.slug))
  }, [miembros, roles])

  // Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filteredMiembros.map((m) => m.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = filteredMiembros.length > 0 && selected.size === filteredMiembros.length

  function getExportData(): ExportData | null {
    const items = filteredMiembros.filter((m) => selected.has(m.id))
    if (items.length === 0) return null

    if (isStaff) {
      return {
        headers: ['Nombre', 'Rol', 'Documento', 'Fecha inicio'],
        rows: items.map((m) => [
          m.personas ? `${m.personas.apellido}, ${m.personas.nombre}` : m.persona_id,
          roles.find((r) => r.slug === m.rol_equipo_slug)?.nombre ?? m.rol_equipo_slug,
          m.personas?.numero_documento ?? '',
          m.fecha_inicio ?? '',
        ]),
        filename: `staff_equipo_${new Date().toISOString().split('T')[0]}`,
      }
    }

    return {
      headers: ['Dorsal', 'Posicion', 'Nombre', 'Documento', 'Fecha inicio'],
      rows: items.map((m) => [
        m.dorsal?.toString() ?? '',
        m.posicion ?? '',
        m.personas ? `${m.personas.apellido}, ${m.personas.nombre}` : m.persona_id,
        m.personas?.numero_documento ?? '',
        m.fecha_inicio ?? '',
      ]),
      filename: `plantel_equipo_${new Date().toISOString().split('T')[0]}`,
    }
  }

  // Dialog persona search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setSelectedPersona(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const result = await buscarPersonas(value)
        if (result.ok) {
          setSearchResults(result.data)
          setShowResults(true)
        }
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function selectPersona(persona: PersonaResult) {
    setSelectedPersona(persona)
    setSearchQuery(`${persona.apellido}, ${persona.nombre}`)
    setShowResults(false)
  }

  function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPersona) {
      toast.error('Selecciona una persona de los resultados de busqueda.')
      return
    }
    startTransition(async () => {
      const result = await agregarMiembro({
        equipo_id: equipoId,
        persona_id: selectedPersona.id,
        rol_equipo_slug: rolSlug,
        dorsal: null,
        posicion: null,
      })
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.message)
      }
    })
  }

  function resetForm() {
    setSearchQuery('')
    setSearchResults([])
    setSelectedPersona(null)
    setRolSlug('')
    setShowResults(false)
  }

  function handleQuitar(miembroId: string) {
    startTransition(async () => {
      const result = await quitarMiembro(miembroId, equipoId)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  const emptyMessage = isStaff
    ? 'No hay staff asignado a este equipo.'
    : 'No hay jugadores en el plantel.'

  function getRolNombre(slug: string): string {
    return roles.find((r) => r.slug === slug)?.nombre ?? slug
  }

  return (
    <div className="space-y-4">
      {/* Header: title + agregar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{isStaff ? 'Staff Tecnico' : 'Plantel'}</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <UserPlus className="h-4 w-4 mr-1" />
            Agregar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar {isStaff ? 'staff' : 'jugador'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAgregar} className="space-y-4">
              {/* Person Search */}
              <div className="space-y-2">
                <Label htmlFor="persona_search">Persona</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="persona_search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
                    placeholder="Buscar por nombre o documento..."
                    className="pl-9"
                    autoComplete="off"
                    required
                  />
                </div>
                {isSearching && (
                  <p className="text-xs text-muted-foreground">Buscando...</p>
                )}
                {showResults && searchResults.length > 0 && (
                  <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-b-0"
                        onClick={() => selectPersona(p)}
                      >
                        <span className="font-medium">{p.apellido}, {p.nombre}</span>
                        {p.numero_documento && (
                          <span className="ml-2 text-muted-foreground">DNI {p.numero_documento}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                  <p className="text-xs text-muted-foreground">No se encontraron personas.</p>
                )}
                {selectedPersona && (
                  <p className="text-xs text-green-600">
                    Seleccionado: {selectedPersona.apellido}, {selectedPersona.nombre}
                    {selectedPersona.numero_documento && ` (DNI ${selectedPersona.numero_documento})`}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select value={rolSlug} onValueChange={(v) => setRolSlug(v ?? '')}>
                  <SelectTrigger id="rol">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.slug} value={r.slug}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending || !selectedPersona || !rolSlug}>
                  {isPending ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterRol} onValueChange={(v) => setFilterRol(v ?? '__all__')}>
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los roles</SelectItem>
            {availableRoles.map((r) => (
              <SelectItem key={r.slug} value={r.slug}>
                {r.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filteredMiembros.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
        ) : (
          filteredMiembros.map((m) => {
            const persona = m.personas
            return (
              <div
                key={m.id}
                className={`rounded-lg border p-3 ${selected.has(m.id) ? 'bg-muted/50 border-primary/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={() => toggleSelect(m.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {persona ? `${persona.apellido}, ${persona.nombre}` : m.persona_id}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {!isStaff && m.dorsal !== null && <span>#{m.dorsal}</span>}
                      {!isStaff && m.posicion && <span>{m.posicion}</span>}
                      {isStaff && <span>{getRolNombre(m.rol_equipo_slug)}</span>}
                      {persona?.numero_documento && <span>DNI {persona.numero_documento}</span>}
                      {m.fecha_inicio && <span>desde {m.fecha_inicio}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => handleQuitar(m.id)}
                    disabled={isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => allSelected ? clearSelection() : selectAll()}
                />
              </TableHead>
              {!isStaff && isVisible('dorsal') && <TableHead className="w-16">Dorsal</TableHead>}
              {!isStaff && isVisible('posicion') && <TableHead>Posicion</TableHead>}
              <TableHead>Nombre</TableHead>
              {isStaff && isVisible('rol') && <TableHead>Rol</TableHead>}
              {isVisible('documento') && <TableHead>Documento</TableHead>}
              {isVisible('email') && <TableHead>Email</TableHead>}
              {isVisible('fecha_inicio') && <TableHead>Desde</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMiembros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredMiembros.map((m) => {
                const persona = m.personas
                return (
                  <TableRow
                    key={m.id}
                    className={selected.has(m.id) ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                      />
                    </TableCell>
                    {!isStaff && isVisible('dorsal') && (
                      <TableCell className="font-bold text-primary">
                        {m.dorsal !== null ? m.dorsal : '—'}
                      </TableCell>
                    )}
                    {!isStaff && isVisible('posicion') && (
                      <TableCell>
                        {m.posicion ? (
                          <Badge variant="outline">{m.posicion}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {persona ? `${persona.apellido}, ${persona.nombre}` : m.persona_id}
                    </TableCell>
                    {isStaff && isVisible('rol') && (
                      <TableCell>
                        <Badge variant="secondary">{getRolNombre(m.rol_equipo_slug)}</Badge>
                      </TableCell>
                    )}
                    {isVisible('documento') && (
                      <TableCell className="text-muted-foreground">
                        {persona?.numero_documento ?? '—'}
                      </TableCell>
                    )}
                    {isVisible('email') && (
                      <TableCell className="text-muted-foreground">
                        {persona?.email_principal ?? '—'}
                      </TableCell>
                    )}
                    {isVisible('fecha_inicio') && (
                      <TableCell className="text-muted-foreground">
                        {m.fecha_inicio ?? '—'}
                      </TableCell>
                    )}
                    {isVisible('estado') && (
                      <TableCell>
                        <Badge variant={m.activo ? 'default' : 'secondary'}>
                          {m.activo ? 'activo' : 'inactivo'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleQuitar(m.id)}
                        disabled={isPending}
                        title="Quitar del equipo"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection bar */}
      <SelectionBar
        count={selected.size}
        total={filteredMiembros.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Footer count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMiembros.length} {isStaff ? 'miembro' : 'jugador'}{filteredMiembros.length !== 1 ? (isStaff ? 's' : 'es') : ''} en total
          {filteredMiembros.length !== miembros.length && (
            <span> (de {miembros.length})</span>
          )}
        </p>
      </div>
    </div>
  )
}
