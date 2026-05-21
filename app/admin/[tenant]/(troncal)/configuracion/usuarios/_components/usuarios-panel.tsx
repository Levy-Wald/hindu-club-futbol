'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Plus, X, Shield, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react'
import {
  asignarAtributoUsuario,
  removerAtributoUsuario,
  fetchCapabilitiesPersona,
} from '../_actions'
import { exportToCSV } from '@/lib/export/formats'

interface Atributo {
  slug: string
  nombre: string
  capa: string
}

interface Persona {
  id: string
  nombre: string
  apellido: string
  email_principal: string | null
  user_id: string | null
  atributos: Atributo[]
}

const CAPA_LABELS: Record<string, string> = {
  troncal_plataforma: 'Troncal',
  troncal_erp: 'ERP',
  troncal_crm: 'CRM',
  modulo_paralelo: 'Módulo',
  vertical_club: 'CCBP',
  vertical_country: 'Country',
  vertical_educativo: 'Educativo',
}

const CAPA_COLORS: Record<string, string> = {
  troncal_plataforma: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  troncal_erp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  troncal_crm: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  modulo_paralelo: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  vertical_club: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  vertical_country: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  vertical_educativo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
}

export function UsuariosPanel({
  usuarios,
  catalogo,
}: {
  usuarios: Persona[]
  catalogo: Atributo[]
}) {
  const [search, setSearch] = useState('')
  const [filterAtributo, setFilterAtributo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<Record<string, string[]>>({})
  const [addDialogFor, setAddDialogFor] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase()
    const matchesSearch = (
      u.nombre.toLowerCase().includes(q) ||
      u.apellido.toLowerCase().includes(q) ||
      (u.email_principal ?? '').toLowerCase().includes(q)
    )
    const matchesAtributo = !filterAtributo || u.atributos.some(a => a.slug === filterAtributo)
    return matchesSearch && matchesAtributo
  })

  function handleToggleExpand(personaId: string) {
    if (expandedId === personaId) {
      setExpandedId(null)
      return
    }
    setExpandedId(personaId)
    if (!capabilities[personaId]) {
      startTransition(async () => {
        const caps = await fetchCapabilitiesPersona(personaId)
        setCapabilities(prev => ({ ...prev, [personaId]: caps }))
      })
    }
  }

  function handleAssign(personaId: string) {
    if (!selectedSlug) return
    startTransition(async () => {
      const result = await asignarAtributoUsuario(personaId, selectedSlug)
      if (result.ok) {
        toast.success('Atributo asignado')
        setAddDialogFor(null)
        setSelectedSlug('')
        // Refresh capabilities
        const caps = await fetchCapabilitiesPersona(personaId)
        setCapabilities(prev => ({ ...prev, [personaId]: caps }))
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  function handleRemove(personaId: string, slug: string) {
    startTransition(async () => {
      const result = await removerAtributoUsuario(personaId, slug)
      if (result.ok) {
        toast.success('Atributo removido')
        const caps = await fetchCapabilitiesPersona(personaId)
        setCapabilities(prev => ({ ...prev, [personaId]: caps }))
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  const dialogPersona = usuarios.find(u => u.id === addDialogFor)
  const dialogExisting = dialogPersona?.atributos.map(a => a.slug) ?? []
  const catalogoFiltered = catalogo.filter(c => !dialogExisting.includes(c.slug))

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAtributo} onValueChange={v => setFilterAtributo(!v || v === '__all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por atributo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los atributos</SelectItem>
            {catalogo.map(c => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            exportToCSV({
              headers: ['Apellido', 'Nombre', 'Email', 'Atributos'],
              rows: filtered.map(u => [
                u.apellido,
                u.nombre,
                u.email_principal ?? '',
                u.atributos.map(a => a.nombre).join(', '),
              ]),
              filename: 'usuarios.csv',
            })
          }}
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map(u => {
          const isExpanded = expandedId === u.id
          const caps = capabilities[u.id]

          return (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {u.apellido}, {u.nombre}
                      </p>
                      {u.user_id && (
                        <Badge variant="outline" className="text-[10px]">Con login</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email_principal ?? 'Sin email'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {u.atributos.map(a => (
                        <Badge
                          key={a.slug}
                          variant="secondary"
                          className={`text-[10px] gap-1 ${CAPA_COLORS[a.capa] ?? ''}`}
                        >
                          {a.nombre}
                          <button
                            onClick={() => handleRemove(u.id, a.slug)}
                            className="ml-0.5 hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddDialogFor(u.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Atributo
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleExpand(u.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Capabilities resultantes
                      </p>
                    </div>
                    {!caps ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Cargando...
                      </div>
                    ) : caps.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin capabilities</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {caps.sort().map(cap => (
                          <Badge key={cap} variant="outline" className="text-[10px] font-mono">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No se encontraron usuarios
          </p>
        )}
      </div>

      {/* Dialog para asignar atributo */}
      <Dialog open={!!addDialogFor} onOpenChange={open => { if (!open) { setAddDialogFor(null); setSelectedSlug('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar atributo a {dialogPersona?.nombre} {dialogPersona?.apellido}
            </DialogTitle>
          </DialogHeader>
          <Select value={selectedSlug} onValueChange={v => setSelectedSlug(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar atributo..." />
            </SelectTrigger>
            <SelectContent>
              {catalogoFiltered.map(c => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.nombre} ({CAPA_LABELS[c.capa] ?? c.capa})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => addDialogFor && handleAssign(addDialogFor)}
              disabled={!selectedSlug || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
