'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { UserPlus, Loader2, Search } from 'lucide-react'
import { agregarMiembroPadron, buscarPersonas } from '../../_actions'

interface CatalogoItem {
  id: string
  slug: string
  nombre: string
}

interface AgregarMiembroDialogProps {
  padronId: string
  estadosPadron: CatalogoItem[]
  tiposSocio: CatalogoItem[]
}

interface PersonaResult {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
}

export function AgregarMiembroDialog({ padronId, estadosPadron, tiposSocio }: AgregarMiembroDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<PersonaResult[]>([])
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null)
  const [estadoPadronId, setEstadoPadronId] = useState('')
  const [tipoSocioId, setTipoSocioId] = useState('')
  const [numeroSocio, setNumeroSocio] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const data = await buscarPersonas(searchQuery.trim())
      setResults(data)
      setSearching(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  function reset() {
    setSearchQuery('')
    setResults([])
    setSelectedPersona(null)
    setEstadoPadronId('')
    setTipoSocioId('')
    setNumeroSocio('')
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset()
    setOpen(value)
  }

  function selectPersona(persona: PersonaResult) {
    setSelectedPersona(persona)
    setResults([])
    setSearchQuery('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPersona) return

    setLoading(true)
    const result = await agregarMiembroPadron({
      padron_id: padronId,
      persona_id: selectedPersona.id,
      estado_padron_id: estadoPadronId || undefined,
      tipo_socio_id: tipoSocioId || undefined,
      numero_socio: numeroSocio || undefined,
    })
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      reset()
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Agregar miembro
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar miembro al padron</DialogTitle>
          <DialogDescription>
            Busca una persona por nombre o documento para agregarla al padron.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Search / Selected persona */}
          {!selectedPersona ? (
            <div className="space-y-2">
              <Label>Buscar persona</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre, apellido o documento..."
                  className="pl-9"
                />
              </div>

              {searching && (
                <p className="text-xs text-muted-foreground">Buscando...</p>
              )}

              {results.length > 0 && (
                <div className="rounded-md border max-h-[200px] overflow-y-auto">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPersona(p)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-0 text-sm"
                    >
                      <span className="font-medium">{p.apellido}, {p.nombre}</span>
                      {p.numero_documento && (
                        <span className="text-muted-foreground ml-2">({p.numero_documento})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && results.length === 0 && (
                <p className="text-xs text-muted-foreground">No se encontraron resultados.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Persona seleccionada</Label>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{selectedPersona.apellido}, {selectedPersona.nombre}</p>
                  {selectedPersona.numero_documento && (
                    <p className="text-xs text-muted-foreground">{selectedPersona.numero_documento}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPersona(null)}>
                  Cambiar
                </Button>
              </div>
            </div>
          )}

          {/* Additional fields (only show when persona selected) */}
          {selectedPersona && (
            <>
              <div className="space-y-2">
                <Label>Estado padron</Label>
                <Select value={estadoPadronId} onValueChange={(v) => setEstadoPadronId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosPadron.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo socio</Label>
                <Select value={tipoSocioId} onValueChange={(v) => setTipoSocioId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSocio.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-socio">Numero de socio</Label>
                <Input
                  id="numero-socio"
                  value={numeroSocio}
                  onChange={(e) => setNumeroSocio(e.target.value)}
                  placeholder="Ej: 1234"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar al padron
              </Button>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
