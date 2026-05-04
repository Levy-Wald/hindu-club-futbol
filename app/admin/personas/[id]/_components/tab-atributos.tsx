'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, X, RotateCcw } from 'lucide-react'
import { asignarAtributo, desactivarAtributo, reactivarAtributo } from '../../_actions'

interface Atributo {
  id: string
  atributo_slug: string
  valor: unknown
  activo: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  created_at: string
}

interface CatalogoItem {
  slug: string
  nombre: string
  categoria: string
}

interface TabAtributosProps {
  personaId: string
  atributos: Atributo[]
  catalogo: CatalogoItem[]
}

const CATEGORIA_COLORS: Record<string, string> = {
  sistema: 'bg-red-500/10 text-red-500 border-red-500/20',
  institucional: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  deportivo: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  familiar: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  fusion: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
}

export function TabAtributos({ personaId, atributos, catalogo }: TabAtributosProps) {
  const [selectedSlug, setSelectedSlug] = useState('')
  const [loading, setLoading] = useState(false)

  const activos = atributos.filter((a) => a.activo)
  const inactivos = atributos.filter((a) => !a.activo)

  // Filtrar catálogo: no mostrar atributos que ya están activos
  const slugsActivos = new Set(activos.map((a) => a.atributo_slug))
  const disponibles = catalogo.filter((c) => !slugsActivos.has(c.slug))

  async function handleAsignar() {
    if (!selectedSlug) return
    setLoading(true)
    const result = await asignarAtributo({
      persona_id: personaId,
      atributo_slug: selectedSlug,
    })
    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
      setSelectedSlug('')
    } else {
      toast.error(result.message)
    }
  }

  async function handleDesactivar(atributoId: string) {
    const result = await desactivarAtributo(atributoId, personaId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  async function handleReactivar(atributoId: string) {
    const result = await reactivarAtributo(atributoId, personaId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  function getNombre(slug: string) {
    return catalogo.find((c) => c.slug === slug)?.nombre ?? slug
  }

  function getCategoria(slug: string) {
    return catalogo.find((c) => c.slug === slug)?.categoria ?? ''
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asignar atributo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedSlug} onValueChange={(v) => setSelectedSlug(v ?? '')}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar atributo..." />
              </SelectTrigger>
              <SelectContent>
                {disponibles.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    <span className="text-muted-foreground text-xs mr-2">[{c.categoria}]</span>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAsignar} disabled={!selectedSlug || loading}>
              <Plus className="mr-1 h-4 w-4" />
              Asignar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atributos activos ({activos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin atributos asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activos.map((a) => {
                const cat = getCategoria(a.atributo_slug)
                return (
                  <Badge
                    key={a.id}
                    variant="outline"
                    className={`gap-1 pr-1 ${CATEGORIA_COLORS[cat] ?? ''}`}
                  >
                    {getNombre(a.atributo_slug)}
                    <button
                      onClick={() => handleDesactivar(a.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {inactivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Atributos inactivos ({inactivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactivos.map((a) => (
                <Badge key={a.id} variant="outline" className="gap-1 pr-1 opacity-50">
                  {getNombre(a.atributo_slug)}
                  <button
                    onClick={() => handleReactivar(a.id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
