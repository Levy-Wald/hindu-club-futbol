'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Send, Users, AlertTriangle } from 'lucide-react'
import { ejecutarEnvioMasivo } from '@/modules/comunicaciones/lib/actions'
import type { SegmentoConfig } from '@/modules/comunicaciones/lib/segmentos/tipos'

interface Plantilla {
  slug: string
  nombre: string
  tipo: string
}

interface Equipo {
  id: string
  nombre: string
}

interface PreviewData {
  total: number
  sin_email: number
}

interface EnvioMasivoWizardProps {
  plantillas: Plantilla[]
  equipos: Equipo[]
}

export function EnvioMasivoWizard({ plantillas, equipos }: EnvioMasivoWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [plantillaSlug, setPlantillaSlug] = useState('')
  const [canal, setCanal] = useState<'email' | 'inapp'>('inapp')
  const [segmentoTipo, setSegmentoTipo] = useState<'todos_activos' | 'equipo'>('todos_activos')
  const [equipoId, setEquipoId] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const segmentoCompleto = segmentoTipo === 'todos_activos' || (segmentoTipo === 'equipo' && equipoId)
  const formCompleto = plantillaSlug && segmentoCompleto

  // Load preview when segmento changes
  useEffect(() => {
    if (!segmentoCompleto) {
      setPreview(null)
      return
    }

    setLoadingPreview(true)
    const segmento: SegmentoConfig = segmentoTipo === 'todos_activos'
      ? { tipo: 'todos_activos' }
      : { tipo: 'equipo', equipo_id: equipoId }

    fetch('/api/comunicaciones/preview-segmento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmento, canal }),
    })
      .then(r => r.json())
      .then((data: PreviewData) => setPreview(data))
      .catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false))
  }, [segmentoTipo, equipoId, canal, segmentoCompleto])

  function handleEnviar() {
    if (!formCompleto) return

    const segmento: SegmentoConfig = segmentoTipo === 'todos_activos'
      ? { tipo: 'todos_activos' }
      : { tipo: 'equipo', equipo_id: equipoId }

    startTransition(async () => {
      const result = await ejecutarEnvioMasivo({
        plantillaSlug,
        canal,
        segmento,
      })

      if (result.ok && result.resultado) {
        setConfirmOpen(false)
        toast.success(`Envío masivo completado: ${result.resultado.total_enviados} enviados, ${result.resultado.total_fallados} fallados`)
        router.push(`/admin/comunicaciones/envios-masivos/${result.resultado.lote_id}`)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6" data-testid="envio-masivo-wizard">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/comunicaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Nuevo envio masivo</h1>
          <p className="text-sm text-muted-foreground">
            Envia una plantilla a multiples personas a la vez
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Sección 1: Plantilla */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Plantilla</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Plantilla</Label>
                <Select value={plantillaSlug} onValueChange={(v) => setPlantillaSlug(v ?? '')} data-testid="select-plantilla">
                  <SelectTrigger data-testid="select-plantilla-trigger">
                    <SelectValue placeholder="Seleccionar plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillas.map(p => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.nombre}
                        <Badge variant="outline" className="ml-2 text-[10px]">{p.tipo}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal de envio</Label>
                <Select value={canal} onValueChange={(v) => setCanal((v ?? 'inapp') as 'email' | 'inapp')}>
                  <SelectTrigger data-testid="select-canal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inapp">In-App (notificacion interna)</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Segmento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Destinatarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={segmentoTipo}
                  onValueChange={(v) => {
                    setSegmentoTipo((v ?? 'todos_activos') as 'todos_activos' | 'equipo')
                    setEquipoId('')
                  }}
                >
                  <SelectTrigger data-testid="select-segmento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos_activos">Todos los socios activos</SelectItem>
                    <SelectItem value="equipo">Equipo especifico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {segmentoTipo === 'equipo' && (
                <div className="space-y-2">
                  <Label>Equipo</Label>
                  <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
                    <SelectTrigger data-testid="select-equipo">
                      <SelectValue placeholder="Seleccionar equipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {equipos.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando destinatarios...
                </div>
              ) : preview ? (
                <div className="space-y-3">
                  <p className="text-2xl font-bold" data-testid="preview-conteo">
                    {preview.total} destinatarios
                  </p>
                  {canal === 'email' && preview.sin_email > 0 && (
                    <div className="flex items-start gap-2 rounded-md bg-warning-50 p-3 text-sm text-warning-700">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {preview.sin_email} persona{preview.sin_email > 1 ? 's' : ''} sin email.
                        Se marcaran como fallados.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona un segmento para ver el conteo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Send button */}
          <div className="mt-4">
            <Button
              className="w-full"
              disabled={!formCompleto || !preview || preview.total === 0 || isPending}
              onClick={() => setConfirmOpen(true)}
              data-testid="btn-enviar-masivo"
            >
              <Send className="h-4 w-4" />
              {preview ? `Enviar a ${preview.total} personas` : 'Enviar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar envio masivo</DialogTitle>
            <DialogDescription>
              Se enviara la plantilla a {preview?.total ?? 0} personas via {canal === 'email' ? 'email' : 'notificacion interna'}.
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={isPending} data-testid="btn-confirmar-envio">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
