'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarSync, Unplug, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { disconnectIntegracion, connectICloud, triggerManualSyncICloud } from '@/lib/calendar-sync/actions'
import { useRouter } from 'next/navigation'

type Integracion = {
  id: string
  proveedor: string
  estado: string
  icloud_email: string | null
  sync_direction: string
  last_sync_at: string | null
}

interface ICloudCalendarCardProps {
  personaId: string
  integracion: Integracion | null
}

const ESTADO_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  connected: { label: 'Conectado', variant: 'default', icon: CheckCircle2 },
  disconnected: { label: 'Desconectado', variant: 'secondary', icon: XCircle },
  error: { label: 'Error', variant: 'destructive', icon: AlertTriangle },
}

export function ICloudCalendarCard({ personaId, integracion }: ICloudCalendarCardProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const router = useRouter()

  const config = integracion ? ESTADO_CONFIG[integracion.estado] ?? ESTADO_CONFIG.disconnected : null

  function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !appPassword.trim()) {
      setMessage('Email y app-specific password son obligatorios')
      return
    }
    startTransition(async () => {
      setMessage(null)
      const result = await connectICloud(personaId, email.trim(), appPassword.trim())
      if (result.ok) {
        setMessage('iCloud Calendar conectado')
        setShowForm(false)
        setEmail('')
        setAppPassword('')
        router.refresh()
      } else {
        setMessage(result.error ?? 'Error al conectar')
      }
    })
  }

  function handleDisconnect() {
    if (!integracion) return
    startTransition(async () => {
      setMessage(null)
      const result = await disconnectIntegracion(integracion.id)
      if (result.ok) {
        setMessage('iCloud Calendar desconectado')
        router.refresh()
      } else {
        setMessage(result.error ?? 'Error al desconectar')
      }
    })
  }

  function handleSync() {
    startTransition(async () => {
      setMessage(null)
      const result = await triggerManualSyncICloud(personaId)
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
          <CalendarSync className="h-5 w-5 text-gray-700" />
          iCloud Calendar
        </CardTitle>
        <CardDescription>
          Sincroniza tus eventos del club con tu calendario de iCloud / Apple Calendar.
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
                {integracion.icloud_email && (
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {integracion.icloud_email}
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
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {!showForm ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Conecta tu cuenta de iCloud para sincronizar eventos con Apple Calendar.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <CalendarSync className="h-4 w-4 mr-2" />
                  Conectar iCloud
                </Button>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Usa una app-specific password generada en{' '}
                  <span className="font-medium">appleid.apple.com &gt; Sign-In and Security &gt; App-Specific Passwords</span>.
                  No uses tu password de iCloud.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="icloud-email">Apple ID / Email</Label>
                  <Input
                    id="icloud-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@icloud.com"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="icloud-password">App-Specific Password</Label>
                  <Input
                    id="icloud-password"
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                    disabled={isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? 'Conectando...' : 'Conectar'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)} disabled={isPending}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {message && (
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{message}</p>
        )}
      </CardContent>
    </Card>
  )
}
