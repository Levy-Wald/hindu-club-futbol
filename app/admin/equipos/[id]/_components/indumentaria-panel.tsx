'use client'

import { useRef, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Shirt, Save, Camera, Upload, Loader2 } from 'lucide-react'
import {
  actualizarIndumentaria,
  actualizarFotoEquipo,
  uploadIndumentariaFoto,
  uploadFotoEquipo,
} from '../../_actions'

const TIPOS_INDUMENTARIA = [
  { key: 'titular', label: 'Titular' },
  { key: 'suplente', label: 'Suplente' },
  { key: 'arquero_titular', label: 'Arquero titular' },
  { key: 'arquero_suplente', label: 'Arquero suplente' },
  { key: 'dia_club', label: 'Dia de club' },
  { key: 'dia_visitante', label: 'Dia visitante' },
]

interface IndumentariaPanelProps {
  equipoId: string
  indumentaria: Record<string, { descripcion?: string; foto_url?: string }>
  fotoEquipoUrl: string | null
}

export function IndumentariaPanel({ equipoId, indumentaria, fotoEquipoUrl }: IndumentariaPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadingKeys, setUploadingKeys] = useState<Set<string>>(new Set())
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
  const [uploadingFotoEquipo, setUploadingFotoEquipo] = useState(false)
  const fotoEquipoInputRef = useRef<HTMLInputElement>(null)

  function updateTipo(key: string, field: 'descripcion' | 'foto_url', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function handleGuardarIndumentaria() {
    startTransition(async () => {
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

  async function handleUploadIndumentariaFoto(tipoKey: string, file: File) {
    setUploadingKeys((prev) => new Set(prev).add(tipoKey))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('equipoId', equipoId)
      formData.append('tipo', tipoKey)

      const result = await uploadIndumentariaFoto(formData)
      if (result.ok) {
        const url = (result.data as { url: string })?.url
        if (url) {
          updateTipo(tipoKey, 'foto_url', url)
        }
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(tipoKey)
        return next
      })
    }
  }

  async function handleUploadFotoEquipo(file: File) {
    setUploadingFotoEquipo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('equipoId', equipoId)

      const result = await uploadFotoEquipo(formData)
      if (result.ok) {
        const url = (result.data as { url: string })?.url
        if (url) {
          setFotoEquipo(url)
        }
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al subir la foto del equipo')
    } finally {
      setUploadingFotoEquipo(false)
    }
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
          <div className="flex items-center gap-2">
            <input
              ref={fotoEquipoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadFotoEquipo(file)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingFotoEquipo}
              onClick={() => fotoEquipoInputRef.current?.click()}
            >
              {uploadingFotoEquipo ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1" />
              )}
              {uploadingFotoEquipo ? 'Subiendo...' : 'Subir desde dispositivo'}
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
              const isUploading = uploadingKeys.has(tipo.key)
              return (
                <IndumentariaTipoCard
                  key={tipo.key}
                  tipoKey={tipo.key}
                  label={tipo.label}
                  descripcion={data.descripcion}
                  fotoUrl={data.foto_url}
                  isUploading={isUploading}
                  onDescripcionChange={(v) => updateTipo(tipo.key, 'descripcion', v)}
                  onFotoUrlChange={(v) => updateTipo(tipo.key, 'foto_url', v)}
                  onFileSelected={(file) => handleUploadIndumentariaFoto(tipo.key, file)}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IndumentariaTipoCard({
  tipoKey,
  label,
  descripcion,
  fotoUrl,
  isUploading,
  onDescripcionChange,
  onFotoUrlChange,
  onFileSelected,
}: {
  tipoKey: string
  label: string
  descripcion: string
  fotoUrl: string
  isUploading: boolean
  onDescripcionChange: (v: string) => void
  onFotoUrlChange: (v: string) => void
  onFileSelected: (file: File) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold">{label}</h4>
      {fotoUrl && (
        <img
          src={fotoUrl}
          alt={label}
          className="w-full h-32 object-contain rounded-md bg-muted"
        />
      )}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Descripcion</Label>
          <Input
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
            placeholder="Ej: Roja con rayas blancas"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL foto</Label>
          <Input
            value={fotoUrl}
            onChange={(e) => onFotoUrlChange(e.target.value)}
            placeholder="URL de la imagen"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelected(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {isUploading ? 'Subiendo...' : 'Subir foto'}
          </Button>
        </div>
      </div>
    </div>
  )
}
