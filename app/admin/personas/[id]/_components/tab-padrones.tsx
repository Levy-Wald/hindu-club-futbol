'use client'

import { useState } from 'react'
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
import { Plus, X } from 'lucide-react'
import { asignarPadron, quitarDePadron } from '../../_actions'

interface PersonaPadron {
  id: string
  padron_id: string
  estado_slug: string
  tipo_socio_slug: string | null
  numero_socio: string | null
  fecha_alta: string | null
  padron: {
    id: string
    nombre: string
    slug: string
  }
}

interface PadronDisponible {
  id: string
  nombre: string
  slug: string
  tipo: string
}

interface TabPadronesProps {
  personaId: string
  personaPadrones: PersonaPadron[]
  padronesDisponibles: PadronDisponible[]
}

export function TabPadrones({ personaId, personaPadrones, padronesDisponibles }: TabPadronesProps) {
  const [padronId, setPadronId] = useState('')
  const [numeroSocio, setNumeroSocio] = useState('')
  const [loading, setLoading] = useState(false)

  // No mostrar padrones donde ya está inscripto (activo)
  const inscriptos = new Set(
    personaPadrones.filter((pp) => pp.estado_slug === 'activo').map((pp) => pp.padron_id)
  )
  const disponibles = padronesDisponibles.filter((p) => !inscriptos.has(p.id))

  async function handleAsignar() {
    if (!padronId) return
    setLoading(true)
    const result = await asignarPadron({
      persona_id: personaId,
      padron_id: padronId,
      estado_slug: 'activo',
      numero_socio: numeroSocio || undefined,
    })
    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
      setPadronId('')
      setNumeroSocio('')
    } else {
      toast.error(result.message)
    }
  }

  async function handleQuitar(personaPadronId: string) {
    const result = await quitarDePadron(personaPadronId, personaId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  const activos = personaPadrones.filter((pp) => pp.estado_slug === 'activo')
  const inactivos = personaPadrones.filter((pp) => pp.estado_slug !== 'activo')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inscribir en padrón</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Padrón</Label>
              <Select value={padronId} onValueChange={(v) => setPadronId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {disponibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>N° socio (opcional)</Label>
              <Input
                value={numeroSocio}
                onChange={(e) => setNumeroSocio(e.target.value)}
                placeholder="Ej: 1234"
              />
            </div>
          </div>
          <Button onClick={handleAsignar} disabled={!padronId || loading}>
            <Plus className="mr-1 h-4 w-4" />
            Inscribir
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Padrones activos ({activos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inscripto en ningún padrón.</p>
          ) : (
            <div className="space-y-2">
              {activos.map((pp) => (
                <div key={pp.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{pp.padron.nombre}</span>
                    {pp.numero_socio && (
                      <Badge variant="outline">N° {pp.numero_socio}</Badge>
                    )}
                    {pp.fecha_alta && (
                      <span className="text-xs text-muted-foreground">
                        Alta: {pp.fecha_alta}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuitar(pp.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Padrones dados de baja ({inactivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactivos.map((pp) => (
                <div key={pp.id} className="flex items-center gap-3 border rounded-md p-3 opacity-50">
                  <span className="text-sm">{pp.padron.nombre}</span>
                  <Badge variant="secondary">{pp.estado_slug}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
