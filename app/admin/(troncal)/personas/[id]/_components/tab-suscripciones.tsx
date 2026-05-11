'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, CreditCard, CalendarX } from 'lucide-react'
import { fetchSuscripcionesPersona, cancelarSuscripcion } from '@/app/admin/(troncal)/finanzas/suscripciones/_actions'

interface Suscripcion {
  id: string
  estado: string
  fecha_alta: string
  fecha_baja: string | null
  monto_pactado: number | null
  motivo_baja: string | null
  origen: string
  plan: { id: string; nombre: string; monto: number; periodicidad: string; moneda: string } | null
}

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  activa: { variant: 'default', label: 'Activa' },
  suspendida: { variant: 'secondary', label: 'Suspendida' },
  cancelada: { variant: 'destructive', label: 'Cancelada' },
  vencida: { variant: 'outline', label: 'Vencida' },
}

export function TabSuscripciones({ personaId }: { personaId: string }) {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchSuscripcionesPersona(personaId).then((data) => {
      setSuscripciones(data as Suscripcion[])
      setLoading(false)
    })
  }, [personaId])

  function handleCancelar(suscripcionId: string) {
    const motivo = prompt('Motivo de cancelación (opcional):')
    startTransition(async () => {
      const result = await cancelarSuscripcion(suscripcionId, motivo ?? undefined)
      if (result.success) {
        toast.success('Suscripción cancelada')
        const updated = await fetchSuscripcionesPersona(personaId)
        setSuscripciones(updated as Suscripcion[])
      } else {
        toast.error(result.error ?? 'Error al cancelar')
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (suscripciones.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No tiene suscripciones registradas</p>
        </CardContent>
      </Card>
    )
  }

  const activas = suscripciones.filter((s) => s.estado === 'activa')
  const inactivas = suscripciones.filter((s) => s.estado !== 'activa')

  return (
    <div className="space-y-4">
      {activas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Suscripciones activas
              <Badge variant="secondary" className="ml-auto">{activas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activas.map((s) => (
              <SuscripcionRow key={s.id} s={s} onCancelar={handleCancelar} isPending={isPending} />
            ))}
          </CardContent>
        </Card>
      )}

      {inactivas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Historial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inactivas.map((s) => (
              <SuscripcionRow key={s.id} s={s} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SuscripcionRow({
  s,
  onCancelar,
  isPending,
}: {
  s: Suscripcion
  onCancelar?: (id: string) => void
  isPending?: boolean
}) {
  const plan = Array.isArray(s.plan) ? s.plan[0] : s.plan
  const badge = ESTADO_BADGE[s.estado] ?? { variant: 'outline' as const, label: s.estado }
  const monto = s.monto_pactado ?? plan?.monto ?? 0

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{plan?.nombre ?? 'Plan desconocido'}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {monto > 0 && (
            <span>${monto.toLocaleString('es-AR')} / {plan?.periodicidad ?? 'mes'}</span>
          )}
          <span>Desde {new Date(s.fecha_alta + 'T00:00:00').toLocaleDateString('es-AR')}</span>
          {s.fecha_baja && (
            <span>Hasta {new Date(s.fecha_baja + 'T00:00:00').toLocaleDateString('es-AR')}</span>
          )}
          {s.origen !== 'manual' && <span className="capitalize">Origen: {s.origen}</span>}
        </div>
        {s.motivo_baja && (
          <p className="mt-1 text-xs text-muted-foreground italic">Motivo: {s.motivo_baja}</p>
        )}
      </div>
      {onCancelar && s.estado === 'activa' && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onCancelar(s.id)}
          disabled={isPending}
        >
          <CalendarX className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
