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
import { crearVinculoCross, desactivarVinculoCross } from '../lib/actions'
import { createClient } from '@/lib/supabase/client'
import type { VinculoCrossConRelaciones } from '../lib/tipos'
import { TIPOS_VINCULO_PERSONA_ENTIDAD, TIPOS_VINCULO_ENTIDAD_ENTIDAD } from '../lib/tipos'

interface SearchResult {
  id: string
  nombre: string
  tipo: 'persona' | 'entidad'
}

interface VinculosCrossTabProps {
  currentId: string
  currentType: 'persona' | 'entidad'
  vinculos: VinculoCrossConRelaciones[]
}

export function VinculosCrossTab({ currentId, currentType, vinculos }: VinculosCrossTabProps) {
  const [tipoVinculo, setTipoVinculo] = useState('')
  const [destinoTipo, setDestinoTipo] = useState<'persona' | 'entidad'>('entidad')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const tiposDisponibles = currentType === 'persona' || destinoTipo === 'persona'
    ? TIPOS_VINCULO_PERSONA_ENTIDAD
    : TIPOS_VINCULO_ENTIDAD_ENTIDAD

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      const supabase = createClient()
      const results: SearchResult[] = []

      if (destinoTipo === 'persona') {
        const { data } = await supabase
          .from('personas')
          .select('id, nombre, apellido')
          .is('deleted_at', null)
          .neq('id', currentId)
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%`)
          .limit(8)
        for (const p of data ?? []) {
          results.push({ id: p.id, nombre: `${p.apellido}, ${p.nombre}`, tipo: 'persona' })
        }
      } else {
        const { data } = await supabase
          .from('entidades')
          .select('id, nombre')
          .is('deleted_at', null)
          .neq('id', currentId)
          .ilike('nombre', `%${searchQuery}%`)
          .limit(8)
        for (const e of data ?? []) {
          results.push({ id: e.id, nombre: e.nombre, tipo: 'entidad' })
        }
      }

      setSearchResults(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, destinoTipo, currentId])

  async function handleCrear() {
    if (!tipoVinculo || !selected) return
    setLoading(true)
    const result = await crearVinculoCross({
      origen_tipo: currentType,
      origen_id: currentId,
      destino_tipo: selected.tipo,
      destino_id: selected.id,
      tipo_vinculo: tipoVinculo,
    })
    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
      setTipoVinculo('')
      setSelected(null)
      setSearchQuery('')
    } else {
      toast.error(result.message)
    }
  }

  async function handleDesactivar(vinculoId: string) {
    const result = await desactivarVinculoCross(vinculoId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  function getOtherSide(v: VinculoCrossConRelaciones) {
    const isOrigen = v.origen_tipo === currentType && v.origen_id === currentId
    return {
      tipo: isOrigen ? v.destino_tipo : v.origen_tipo,
      id: isOrigen ? v.destino_id : v.origen_id,
      nombre: isOrigen ? v.destino_nombre : v.origen_nombre,
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agregar vínculo con entidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Buscar en</Label>
              <Select value={destinoTipo} onValueChange={(v) => {
                setDestinoTipo((v ?? 'entidad') as 'persona' | 'entidad')
                setSelected(null)
                setSearchQuery('')
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentType === 'entidad' && (
                    <SelectItem value="persona">Personas</SelectItem>
                  )}
                  <SelectItem value="entidad">Entidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de vínculo</Label>
              <Select value={tipoVinculo} onValueChange={(v) => setTipoVinculo(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDisponibles.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{destinoTipo === 'persona' ? 'Persona' : 'Entidad'}</Label>
              {selected ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{selected.nombre}</span>
                  <button onClick={() => { setSelected(null); setSearchQuery('') }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => { setSelected(r); setSearchResults([]) }}
                        >
                          {r.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleCrear} disabled={!tipoVinculo || !selected || loading}>
            <Plus className="mr-1 h-4 w-4" />
            Crear vínculo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vínculos con entidades ({vinculos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {vinculos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin vínculos registrados.</p>
          ) : (
            <div className="space-y-2">
              {vinculos.map((v) => {
                const other = getOtherSide(v)
                return (
                  <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline">{v.tipo_vinculo}</Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {other.tipo === 'persona' ? 'Persona' : 'Entidad'}
                      </Badge>
                      <Link
                        href={other.tipo === 'persona' ? `/admin/personas/${other.id}` : `/admin/entidades/${other.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {other.nombre ?? 'Sin nombre'}
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDesactivar(v.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
