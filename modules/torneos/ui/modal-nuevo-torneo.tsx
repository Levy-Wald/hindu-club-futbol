'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { crearTorneoAction } from '../lib/actions'
import { FORMATOS } from '../lib/formatos'
import { PRESETS } from '../lib/criterios-desempate'
import type { Federacion, TipoTorneo, FormatoTorneo } from '../lib/types'

export function ModalNuevoTorneo({
  federaciones,
  onClose,
}: {
  federaciones: Federacion[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [paso, setPaso] = useState(1)
  const [error, setError] = useState('')

  // Paso 1
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [temporada, setTemporada] = useState('')
  const [tipo, setTipo] = useState<TipoTorneo>('interno')
  const [federacionId, setFederacionId] = useState('')
  const [formato, setFormato] = useState<FormatoTorneo>('liga')

  // Paso 2
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [nivelCompetencia, setNivelCompetencia] = useState('')

  // Paso 3
  const [presetDesempate, setPresetDesempate] = useState('argentina')

  const formatoInfo = FORMATOS.find((f) => f.slug === formato)

  function handleNext() {
    if (paso === 1) {
      if (!nombre.trim()) {
        setError('El nombre es obligatorio')
        return
      }
      setError('')
      setPaso(2)
    } else if (paso === 2) {
      setError('')
      setPaso(3)
    }
  }

  function handleBack() {
    setError('')
    setPaso(paso - 1)
  }

  function handleSubmit() {
    const criterios =
      presetDesempate === 'argentina'
        ? PRESETS.argentina.criterios
        : presetDesempate === 'fifa'
          ? PRESETS.fifa.criterios
          : PRESETS.argentina.criterios

    startTransition(async () => {
      const result = await crearTorneoAction({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo,
        formato,
        federacion_id: tipo === 'externo' && federacionId ? federacionId : undefined,
        temporada: temporada.trim() || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        nivel_competencia_slug: nivelCompetencia || undefined,
        criterios_desempate: criterios,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg" data-testid="modal-nuevo-torneo">
        <DialogHeader>
          <DialogTitle>Nuevo torneo — Paso {paso} de 3</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {paso === 1 && (
          <div className="space-y-4" data-testid="wizard-paso-1">
            <div>
              <Label>Nombre *</Label>
              <Input
                data-testid="input-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Apertura 2026"
              />
            </div>

            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripcion opcional..."
                rows={2}
              />
            </div>

            <div>
              <Label>Temporada</Label>
              <Input
                data-testid="input-temporada"
                value={temporada}
                onChange={(e) => setTemporada(e.target.value)}
                placeholder="Ej: 2026 Apertura"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="interno"
                    checked={tipo === 'interno'}
                    onChange={() => setTipo('interno')}
                    data-testid="radio-interno"
                  />
                  <span className="text-sm">Interno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="externo"
                    checked={tipo === 'externo'}
                    onChange={() => setTipo('externo')}
                    data-testid="radio-externo"
                  />
                  <span className="text-sm">Externo</span>
                </label>
              </div>
            </div>

            {tipo === 'externo' && federaciones.length > 0 && (
              <div>
                <Label>Federacion</Label>
                <Select
                  value={federacionId}
                  onValueChange={(v) => setFederacionId(v ?? '')}
                >
                  <SelectTrigger data-testid="select-federacion">
                    <SelectValue placeholder="Seleccionar federacion..." />
                  </SelectTrigger>
                  <SelectContent>
                    {federaciones.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Formato *</Label>
              <Select
                value={formato}
                onValueChange={(v) => setFormato((v ?? 'liga') as FormatoTorneo)}
              >
                <SelectTrigger data-testid="select-formato">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATOS.map((f) => (
                    <SelectItem key={f.slug} value={f.slug}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formatoInfo && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatoInfo.descripcion}
                </p>
              )}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4" data-testid="wizard-paso-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  data-testid="input-fecha-inicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  data-testid="input-fecha-fin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Nivel de competencia</Label>
              <Select
                value={nivelCompetencia}
                onValueChange={(v) => setNivelCompetencia(v === '__none__' ? '' : (v ?? ''))}
              >
                <SelectTrigger data-testid="select-nivel">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  <SelectItem value="amateur_federado">Amateur federado</SelectItem>
                  <SelectItem value="escuela">Escuela</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="recreativo">Recreativo</SelectItem>
                  <SelectItem value="representativo">Representativo / Seleccion</SelectItem>
                  <SelectItem value="semi_profesional">Semi-profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4" data-testid="wizard-paso-3">
            <div>
              <Label>Criterios de desempate</Label>
              <Select
                value={presetDesempate}
                onValueChange={(v) => setPresetDesempate(v ?? 'argentina')}
              >
                <SelectTrigger data-testid="select-desempate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="argentina">
                    {PRESETS.argentina.label}
                  </SelectItem>
                  <SelectItem value="fifa">{PRESETS.fifa.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Orden de criterios:</p>
              <ol className="list-decimal ml-5">
                {(presetDesempate === 'fifa'
                  ? PRESETS.fifa.criterios
                  : PRESETS.argentina.criterios
                ).map((c, i) => (
                  <li key={i}>{c.replace(/_/g, ' ')}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <div>
            {paso > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {paso < 3 ? (
              <Button onClick={handleNext} data-testid="btn-siguiente">
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                data-testid="btn-crear-torneo"
              >
                {isPending ? 'Creando...' : 'Crear torneo'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
