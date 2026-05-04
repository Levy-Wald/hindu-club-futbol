'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, X, Search } from 'lucide-react'
import { asignarVinculo, desactivarVinculo } from '../../_actions'
import { createClient } from '@/lib/supabase/client'

interface PersonaRef {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
}

interface Vinculo {
  id: string
  tipo_vinculo_slug: string
  activo: boolean
  fecha_inicio: string | null
  notas: string | null
  destino?: PersonaRef
  origen?: PersonaRef
}

interface CatalogoVinculo {
  slug: string
  nombre: string
  categoria: string
}

interface TabVinculosProps {
  personaId: string
  vinculosOrigen: Vinculo[]
  vinculosDestino: Vinculo[]
  catalogoVinculos: CatalogoVinculo[]
}

export function TabVinculos({ personaId, vinculosOrigen, vinculosDestino, catalogoVinculos }: TabVinculosProps) {
  const [tipoSlug, setTipoSlug] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaRef[]>([])
  const [selectedPersona, setSelectedPersona] = useState<PersonaRef | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, numero_documento')
        .is('deleted_at', null)
        .neq('id', personaId)
        .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,numero_documento.ilike.%${searchQuery}%`)
        .limit(10)
      setSearchResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, personaId])

  async function handleAsignar() {
    if (!tipoSlug || !selectedPersona) return
    setLoading(true)
    const result = await asignarVinculo({
      persona_origen_id: personaId,
      persona_destino_id: selectedPersona.id,
      tipo_vinculo_slug: tipoSlug,
    })
    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
      setTipoSlug('')
      setSelectedPersona(null)
      setSearchQuery('')
    } else {
      toast.error(result.message)
    }
  }

  async function handleDesactivar(vinculoId: string) {
    const result = await desactivarVinculo(vinculoId, personaId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  const todosVinculos = [
    ...vinculosOrigen.map((v) => ({ ...v, persona: v.destino, direccion: 'origen' as const })),
    ...vinculosDestino.map((v) => ({ ...v, persona: v.origen, direccion: 'destino' as const })),
  ].filter((v) => v.activo)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agregar vínculo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de vínculo</Label>
              <Select value={tipoSlug} onValueChange={(v) => setTipoSlug(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogoVinculos.map((v) => (
                    <SelectItem key={v.slug} value={v.slug}>
                      {v.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Persona vinculada</Label>
              {selectedPersona ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm">
                  <span className="flex-1">
                    {selectedPersona.apellido}, {selectedPersona.nombre}
                  </span>
                  <button onClick={() => { setSelectedPersona(null); setSearchQuery('') }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar persona..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => { setSelectedPersona(p); setSearchResults([]) }}
                        >
                          {p.apellido}, {p.nombre} {p.numero_documento ? `(${p.numero_documento})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleAsignar} disabled={!tipoSlug || !selectedPersona || loading}>
            <Plus className="mr-1 h-4 w-4" />
            Crear vínculo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vínculos activos ({todosVinculos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {todosVinculos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin vínculos registrados.</p>
          ) : (
            <div className="space-y-2">
              {todosVinculos.map((v) => (
                <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{v.tipo_vinculo_slug}</Badge>
                    {v.persona && (
                      <Link
                        href={`/admin/personas/${v.persona.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {v.persona.apellido}, {v.persona.nombre}
                      </Link>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDesactivar(v.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
