'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, Mail, Info, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { marcarComoLeido, marcarTodoLeido } from '../../comunicaciones/_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Mensaje {
  id: string
  asunto: string
  cuerpo: string
  tipo: string
  leido: boolean
  leido_at: string | null
  created_at: string
}

interface NotificacionesClientProps {
  mensajes: Mensaje[]
  personaId: string
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function tiempoRelativo(fecha: string): string {
  const now = new Date()
  const then = new Date(fecha)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return formatFecha(fecha)
}

const TIPO_ICONS: Record<string, typeof Bell> = {
  info: Info,
  alerta: AlertTriangle,
  exito: CheckCircle2,
  email: Mail,
}

const TIPO_COLORS: Record<string, string> = {
  info: 'text-brand-500',
  alerta: 'text-gold-500',
  exito: 'text-success-600',
  email: 'text-brand-900',
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function NotificacionesClient({ mensajes: initialMensajes, personaId }: NotificacionesClientProps) {
  const [mensajes, setMensajes] = useState(initialMensajes)
  const [isPending, startTransition] = useTransition()

  const noLeidos = mensajes.filter((m) => !m.leido).length

  function handleMarcarLeido(mensajeId: string) {
    // Optimistic update
    setMensajes((prev) =>
      prev.map((m) =>
        m.id === mensajeId ? { ...m, leido: true, leido_at: new Date().toISOString() } : m
      )
    )

    startTransition(async () => {
      const result = await marcarComoLeido(mensajeId)
      if (!result.ok) {
        // Revert
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === mensajeId ? { ...m, leido: false, leido_at: null } : m
          )
        )
        toast.error(result.message)
      }
    })
  }

  function handleMarcarTodoLeido() {
    // Optimistic update
    setMensajes((prev) =>
      prev.map((m) => ({ ...m, leido: true, leido_at: m.leido_at ?? new Date().toISOString() }))
    )

    startTransition(async () => {
      const result = await marcarTodoLeido(personaId)
      if (result.ok) {
        toast.success('Todas las notificaciones marcadas como leidas')
      } else {
        // Revert
        setMensajes(initialMensajes)
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      {/* Acciones */}
      {noLeidos > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarcarTodoLeido} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Marcar todo como leido
          </Button>
        </div>
      )}

      {/* Lista de notificaciones */}
      {mensajes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No tenes notificaciones todavia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {mensajes.map((m) => {
            const Icon = TIPO_ICONS[m.tipo] ?? Bell
            const iconColor = TIPO_COLORS[m.tipo] ?? 'text-muted-foreground'

            return (
              <Card
                key={m.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !m.leido ? 'border-l-2 border-l-brand-500 bg-brand-500/5' : ''
                }`}
                onClick={() => {
                  if (!m.leido) handleMarcarLeido(m.id)
                }}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 shrink-0">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${!m.leido ? 'font-semibold' : ''}`}>
                        {m.asunto}
                      </p>
                      {!m.leido && (
                        <Badge variant="default" className="bg-brand-500 text-[10px]">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {m.cuerpo}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {tiempoRelativo(m.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
