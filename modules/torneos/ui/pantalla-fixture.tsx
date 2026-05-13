'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { generarFixturePreviewAction, confirmarFixtureAction } from '../lib/fixture-actions'
import type { FixturePreview, FixtureOptions } from '../lib/fixture-generators'
import type { FormatoTorneo } from '../lib/types'

export function PantallaFixture({
  torneoId,
  torneoNombre,
  formato,
  categorias,
}: {
  torneoId: string
  torneoNombre: string
  formato: string
  categorias: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [preview, setPreview] = useState<FixturePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState(false)
  const [eventosCreados, setEventosCreados] = useState<number | null>(null)

  // Options
  const [idaYVuelta, setIdaYVuelta] = useState(false)
  const [incluyeTercerPuesto, setIncluyeTercerPuesto] = useState(false)
  const [equiposPorGrupo, setEquiposPorGrupo] = useState(4)
  const [fechaInicio, setFechaInicio] = useState('')

  const fmt = formato as FormatoTorneo

  function handleGenerar() {
    setError(null)
    setPreview(null)
    setConfirmado(false)
    setEventosCreados(null)

    const options: FixtureOptions = {}
    if (fmt === 'liga') options.ida_y_vuelta = idaYVuelta
    if (fmt === 'eliminacion' || fmt === 'grupos_playoff' || fmt === 'cuadrangular') {
      options.incluir_tercer_puesto = incluyeTercerPuesto
    }
    if (fmt === 'grupos_playoff') options.equipos_por_grupo = equiposPorGrupo

    startTransition(async () => {
      const res = await generarFixturePreviewAction({
        torneo_id: torneoId,
        categoria_id: categoriaId || undefined,
        options,
      })
      if (res.ok) {
        setPreview(res.preview)
      } else {
        setError(res.error)
      }
    })
  }

  function handleConfirmar() {
    if (!preview) return

    startTransition(async () => {
      const res = await confirmarFixtureAction({
        torneo_id: torneoId,
        categoria_id: categoriaId || undefined,
        partidos: preview.partidos,
        fecha_inicio: fechaInicio || undefined,
      })
      if (res.ok) {
        setConfirmado(true)
        setEventosCreados(res.eventos_creados)
      } else {
        setError(res.error)
      }
    })
  }

  // Group partidos by fecha_numero for display
  const partidosPorFecha: Record<number, FixturePreview['partidos']> = {}
  if (preview) {
    for (const p of preview.partidos) {
      if (!partidosPorFecha[p.fecha_numero]) partidosPorFecha[p.fecha_numero] = []
      partidosPorFecha[p.fecha_numero].push(p)
    }
  }

  return (
    <div data-testid="pantalla-fixture">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/competencias/torneos/${torneoId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Generar fixture</h1>
          <p className="text-sm text-muted-foreground">{torneoNombre}</p>
        </div>
      </div>

      {/* Options panel */}
      <div className="rounded-lg border p-4 mb-4 space-y-4" data-testid="panel-opciones">
        {categorias.length > 0 && (
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? '')}>
              <SelectTrigger data-testid="select-categoria-fixture">
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {fmt === 'liga' && (
          <div className="flex items-center gap-2">
            <Switch
              checked={idaYVuelta}
              onCheckedChange={setIdaYVuelta}
              data-testid="switch-ida-vuelta"
            />
            <Label>Ida y vuelta</Label>
          </div>
        )}

        {(fmt === 'eliminacion' || fmt === 'grupos_playoff' || fmt === 'cuadrangular') && (
          <div className="flex items-center gap-2">
            <Switch
              checked={incluyeTercerPuesto}
              onCheckedChange={setIncluyeTercerPuesto}
              data-testid="switch-tercer-puesto"
            />
            <Label>Incluir partido por 3er puesto</Label>
          </div>
        )}

        {fmt === 'grupos_playoff' && (
          <div className="space-y-1">
            <Label>Equipos por grupo</Label>
            <Input
              type="number"
              min={3}
              max={8}
              value={equiposPorGrupo}
              onChange={(e) => setEquiposPorGrupo(Number(e.target.value))}
              className="w-24"
              data-testid="input-equipos-por-grupo"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label>Fecha del primer partido</Label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-48"
            data-testid="input-fecha-inicio"
          />
          <p className="text-xs text-muted-foreground">
            Cada fecha/jornada se programa con 7 dias de diferencia
          </p>
        </div>

        <Button
          onClick={handleGenerar}
          disabled={isPending}
          data-testid="btn-generar-preview"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Generar preview
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 mb-4 text-sm text-destructive" data-testid="error-fixture">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && !confirmado && (
        <div data-testid="preview-fixture">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Preview del fixture</h2>
              <p className="text-sm text-muted-foreground">
                {preview.total_partidos} partidos en {preview.total_fechas} fecha(s)
              </p>
            </div>
            <Button onClick={handleConfirmar} disabled={isPending} data-testid="btn-confirmar-fixture">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar y crear partidos
            </Button>
          </div>

          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 mb-3 text-sm" data-testid="warnings-fixture">
              {preview.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          {Object.entries(partidosPorFecha)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([fecha, partidos]) => (
              <div key={fecha} className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Fecha {fecha}
                  {partidos[0]?.fase && (
                    <span className="ml-2 text-xs font-normal">({partidos[0].fase})</span>
                  )}
                </h3>
                <div className="space-y-1">
                  {partidos
                    .sort((a, b) => a.orden - b.orden)
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
                        data-testid="partido-preview"
                      >
                        <span className="flex-1 text-right font-medium">
                          {p.local.nombre}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="flex-1 font-medium">
                          {p.visitante.nombre}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Confirmed */}
      {confirmado && eventosCreados !== null && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center" data-testid="fixture-confirmado">
          <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold">Fixture creado exitosamente</p>
          <p className="text-sm text-muted-foreground">
            {eventosCreados} partido(s) programado(s)
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => router.push(`/admin/competencias/torneos/${torneoId}`)}
          >
            Volver al torneo
          </Button>
        </div>
      )}
    </div>
  )
}
