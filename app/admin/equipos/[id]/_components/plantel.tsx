'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { UserPlus, UserMinus, Search, Hash, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { agregarMiembro, quitarMiembro, buscarPersonas } from '../../_actions'

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

export function Plantel({ equipoId, miembros, roles, tipo }: PlantelProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [rolSlug, setRolSlug] = useState('')
  const [dorsal, setDorsal] = useState('')
  const [posicion, setPosicion] = useState('')

  // Group miembros by role
  const groupedMiembros = miembros.reduce<Record<string, Miembro[]>>((acc, m) => {
    const key = m.rol_equipo_slug
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

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
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        posicion: posicion || null,
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
    setDorsal('')
    setPosicion('')
    setShowResults(false)
  }

  function handleQuitar(miembroId: string) {
    startTransition(async () => {
      const result = await quitarMiembro(miembroId, equipoId)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  const isStaff = tipo === 'staff'
  const emptyMessage = isStaff
    ? 'No hay staff asignado a este equipo.'
    : 'No hay jugadores en el plantel.'

  return (
    <div className="space-y-4">
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

              {/* Dorsal & Position (only for jugadores) */}
              {!isStaff && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dorsal">Dorsal</Label>
                    <Input
                      id="dorsal"
                      type="number"
                      value={dorsal}
                      onChange={(e) => setDorsal(e.target.value)}
                      placeholder="Ej: 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="posicion">Posicion</Label>
                    <Input
                      id="posicion"
                      value={posicion}
                      onChange={(e) => setPosicion(e.target.value)}
                      placeholder="Ej: Delantero"
                    />
                  </div>
                </div>
              )}

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

      {miembros.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMiembros).map(([rolSlug, members]) => {
            const rol = roles.find((r) => r.slug === rolSlug)
            return (
              <div key={rolSlug} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {rol?.nombre ?? rolSlug}
                  <span className="ml-2 text-xs font-normal">({members.length})</span>
                </h3>

                {/* Mobile: Cards */}
                <div className="sm:hidden space-y-2">
                  {members.map((m) => (
                    <MemberCard
                      key={m.id}
                      miembro={m}
                      isStaff={isStaff}
                      onQuitar={handleQuitar}
                      isPending={isPending}
                    />
                  ))}
                </div>

                {/* Desktop: Table-like grid */}
                <div className="hidden sm:block rounded-lg border divide-y">
                  {members.map((m) => (
                    <MemberRow
                      key={m.id}
                      miembro={m}
                      isStaff={isStaff}
                      onQuitar={handleQuitar}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MemberCard({
  miembro,
  isStaff,
  onQuitar,
  isPending,
}: {
  miembro: Miembro
  isStaff: boolean
  onQuitar: (id: string) => void
  isPending: boolean
}) {
  const persona = miembro.personas

  return (
    <div className={`rounded-lg border p-3 ${isStaff ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900 dark:bg-indigo-950/20' : ''}`}>
      <div className="flex items-center gap-3">
        {!isStaff && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {miembro.dorsal !== null ? (
              <span>{miembro.dorsal}</span>
            ) : (
              <Hash className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
        {isStaff && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Shield className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {persona ? `${persona.apellido}, ${persona.nombre}` : miembro.persona_id}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {miembro.posicion && <span>{miembro.posicion}</span>}
            {miembro.fecha_inicio && <span>desde {miembro.fecha_inicio}</span>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive"
          onClick={() => onQuitar(miembro.id)}
          disabled={isPending}
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function MemberRow({
  miembro,
  isStaff,
  onQuitar,
  isPending,
}: {
  miembro: Miembro
  isStaff: boolean
  onQuitar: (id: string) => void
  isPending: boolean
}) {
  const persona = miembro.personas

  return (
    <div className={`flex items-center gap-4 px-4 py-3 ${isStaff ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
      {!isStaff && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
          {miembro.dorsal !== null ? miembro.dorsal : '—'}
        </div>
      )}
      {isStaff && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
          <Shield className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {persona ? `${persona.apellido}, ${persona.nombre}` : miembro.persona_id}
        </p>
      </div>
      {miembro.posicion && (
        <Badge variant="outline" className="hidden lg:inline-flex">
          {miembro.posicion}
        </Badge>
      )}
      {miembro.fecha_inicio && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          desde {miembro.fecha_inicio}
        </span>
      )}
      {persona?.numero_documento && (
        <span className="text-xs text-muted-foreground hidden xl:inline">
          DNI {persona.numero_documento}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive"
        onClick={() => onQuitar(miembro.id)}
        disabled={isPending}
      >
        <UserMinus className="h-4 w-4" />
      </Button>
    </div>
  )
}

