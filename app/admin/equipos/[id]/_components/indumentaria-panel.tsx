'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Shirt, Plus, Save, Image, Camera } from 'lucide-react'
import { actualizarIndumentaria, actualizarFotoEquipo } from '../../_actions'

const TIPOS_INDUMENTARIA = [
  { key: 'titular', label: 'Titular' },
  { key: 'suplente', label: 'Suplente' },
  { key: 'arquero_titular', label: 'Arquero titular' },
  { key: 'arquero_suplente', label: 'Arquero suplente' },
  { key: 'dia_club', label: 'Día de club' },
  { key: 'dia_visitante', label: 'Día visitante' },
]

interface IndumentariaPanelProps {
  equipoId: string
  indumentaria: Record<string, { descripcion?: string; foto_url?: string }>
  fotoEquipoUrl: string | null
}

export function IndumentariaPanel({ equipoId, indumentaria, fotoEquipoUrl }: IndumentariaPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<Record<string, { descripcion: string; foto_url: string }>>(
    () => {
      const init: Record<string, { descripcion: string; foto_url: string }> = {}
      for (const tipo of TIPOS_INDUMENTARIA) {
        const existing = indumentaria[tipo.key]
        init[tipo.key] = {
          descripcion: existing?.descripcion || '',
          foto_url: existing?.foto_url || '',
        }
      }
      return init
    }
  )
  const [fotoEquipo, setFotoEquipo] = useState(fotoEquipoUrl || '')

  function updateTipo(key: string, field: 'descripcion' | 'foto_url', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function handleGuardarIndumentaria() {
    startTransition(async () => {
      // Filtrar solo los tipos que tienen datos
      const datos: Record<string, { descripcion?: string; foto_url?: string }> = {}
      for (const [key, val] of Object.entries(form)) {
        if (val.descripcion || val.foto_url) {
          datos[key] = {}
          if (val.descripcion) datos[key].descripcion = val.descripcion
          if (val.foto_url) datos[key].foto_url = val.foto_url
        }
      }
      const result = await actualizarIndumentaria(equipoId, datos)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  function handleGuardarFotoEquipo() {
    startTransition(async () => {
      const result = await actualizarFotoEquipo(equipoId, fotoEquipo || null)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <div className="space-y-6">
      {/* Foto del equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Foto del equipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fotoEquipo && (
            <img src={fotoEquipo} alt="Foto equipo" className="w-full h-48 object-cover rounded-md" />
          )}
          <div className="flex gap-2">
            <Input
              value={fotoEquipo}
              onChange={(e) => setFotoEquipo(e.target.value)}
              placeholder="URL de la foto del equipo"
              className="flex-1"
            />
            <Button size="sm" onClick={handleGuardarFotoEquipo} disabled={isPending}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indumentaria por tipo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Camisetas e indumentaria
          </CardTitle>
          <Button size="sm" onClick={handleGuardarIndumentaria} disabled={isPending}>
            <Save className="h-3.5 w-3.5 mr-1" />
            Guardar todo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIPOS_INDUMENTARIA.map((tipo) => {
              const data = form[tipo.key]
              return (
                <div key={tipo.key} className="border rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold">{tipo.label}</h4>
                  {data.foto_url && (
                    <img
                      src={data.foto_url}
                      alt={tipo.label}
                      className="w-full h-32 object-contain rounded-md bg-muted"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={data.descripcion}
                        onChange={(e) => updateTipo(tipo.key, 'descripcion', e.target.value)}
                        placeholder="Ej: Roja con rayas blancas"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL foto</Label>
                      <Input
                        value={data.foto_url}
                        onChange={(e) => updateTipo(tipo.key, 'foto_url', e.target.value)}
                        placeholder="URL de la imagen"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
