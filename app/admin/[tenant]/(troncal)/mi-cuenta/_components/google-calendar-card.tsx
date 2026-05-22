'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarSync, Unplug, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { disconnectIntegracion, triggerManualSync } from '@/lib/calendar-sync/actions'
import { useRouter } from 'next/navigation'

type Integracion = {
  id: string
  proveedor: string
  estado: string
  google_calendar_id: string | null
  sync_direction: string
  last_sync_at: string | null
}

interface GoogleCalendarCardProps {
  personaId: string
  integracion: Integracion | null
  googleAuthUrl: string
}

const ESTADO_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  connected: { label: 'Conectado', variant: 'default', icon: CheckCircle2 },
  disconnected: { label: 'Desconectado', variant: 'secondary', icon: XCircle },
  error: { label: 'Error', variant: 'destructive', icon: AlertTriangle },
  expired: { label: 'Token expirado', variant: 'destructive', icon: AlertTriangle },
}

export function GoogleCalendarCard({ personaId, integracion, googleAuthUrl }: GoogleCalendarCardProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const config = integracion ? ESTADO_CONFIG[integracion.estado] ?? ESTADO_CONFIG.disconnected : null

  function handleDisconnect() {
    if (!integracion) return
    startTransition(async () => {
      setMessage(null)
      const result = await disconnectIntegracion(integracion.id)
      if (result.ok) {
        setMessage('Google Calendar desconectado')
        router.refresh()
      } else {
        setMessage(result.error ?? 'Error al desconectar')
      }
    })
  }

  function handleSync() {
    startTransition(async () => {
      setMessage(null)
      const result = await triggerManualSync(personaId)
      if (result.ok) {
        setMessage('Sincronizacion completada')
        router.refresh()
      } else {
        setMessage(result.error ?? 'Error al sincronizar')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarSync className="h-5 w-5 text-brand-500" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sincroniza tus eventos del club con tu calendario personal de Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {integracion && config ? (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={config.variant}>
                    <config.icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {integracion.sync_direction === 'two-way' ? 'Bidireccional' :
                      integracion.sync_direction === 'read-only' ? 'Solo lectura' : 'Solo escritura'}
                  </span>
                </div>
                {integracion.google_calendar_id && (
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                    Calendario: {integracion.google_calendar_id}
                  </p>
                )}
                {integracion.last_sync_at && (
                  <p className="text-xs text-muted-foreground">
                    Ultima sincronizacion: {new Date(integracion.last_sync_at).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {integracion.estado === 'connected' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
                  Sincronizar ahora
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                <Unplug className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
              {(integracion.estado === 'error' || integracion.estado === 'expired') && (
                <Button
                  size="sm"
                  render={<a href={googleAuthUrl} />}
                >
                  Reconectar
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Conecta tu cuenta de Google para sincronizar eventos automaticamente.
            </p>
            <Button
              render={<a href={googleAuthUrl} />}
            >
              <CalendarSync className="h-4 w-4 mr-2" />
              Conectar Google Calendar
            </Button>
          </div>
        )}

        {message && (
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{message}</p>
        )}
      </CardContent>
    </Card>
  )
}
