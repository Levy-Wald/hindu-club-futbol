'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Notif {
  id: string
  titulo: string
  mensaje: string
  prioridad: string
  link_accion: string | null
  leida_at: string | null
  created_at: string
  tipo_slug: string
}

interface NotificacionesDropdownProps {
  personaId: string
}

export function NotificacionesDropdown({ personaId }: NotificacionesDropdownProps) {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [countNoLeidos, setCountNoLeidos] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch(`/api/notificaciones?persona_id=${personaId}&limit=10`)
      if (!res.ok) return
      const data = await res.json() as unknown
      if (typeof data !== 'object' || data === null || !('notifs' in data)) return
      const payload = data as { notifs: Notif[]; count_no_leidos: number }
      setNotifs(Array.isArray(payload.notifs) ? payload.notifs : [])
      setCountNoLeidos(typeof payload.count_no_leidos === 'number' ? payload.count_no_leidos : 0)
    } catch {
      // silenciar errores de polling
    }
  }, [personaId])

  useEffect(() => {
    void fetchNotificaciones()
    const interval = setInterval(() => {
      void fetchNotificaciones()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotificaciones])

  async function handleMarcarLeido(notifId: string, linkAccion: string | null) {
    try {
      await fetch('/api/notificaciones/leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacion_id: notifId }),
      })
      setNotifs((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, leida_at: new Date().toISOString() } : n
        )
      )
      setCountNoLeidos((prev) => Math.max(0, prev - 1))
    } catch {
      // silenciar
    }

    if (linkAccion) {
      router.push(linkAccion)
    }
  }

  async function handleMarcarTodos() {
    setLoading(true)
    try {
      await fetch('/api/notificaciones/leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos: true, persona_id: personaId }),
      })
      setNotifs((prev) =>
        prev.map((n) => ({ ...n, leida_at: n.leida_at ?? new Date().toISOString() }))
      )
      setCountNoLeidos(0)
    } catch {
      // silenciar
    } finally {
      setLoading(false)
    }
  }

  function truncar(texto: string | null, max: number): string {
    if (!texto) return ''
    return texto.length > max ? texto.slice(0, max) + '...' : texto
  }

  function tiempoRelativo(fecha: string): string {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es })
    } catch {
      return ''
    }
  }

  const badgeColor =
    countNoLeidos === 0 ? '' :
    notifs.some(n => !n.leida_at && n.prioridad === 'critica') ? 'bg-destructive' :
    notifs.some(n => !n.leida_at && n.prioridad === 'alta') ? 'bg-warning text-warning-foreground' :
    'bg-primary'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-4 w-4" />
          {countNoLeidos > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full ${badgeColor} text-primary-foreground px-1 text-[10px] font-bold`}>
              {countNoLeidos > 99 ? '99+' : countNoLeidos}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {countNoLeidos > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {countNoLeidos} sin leer
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifs.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifs.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  'flex flex-col items-start gap-1 px-3 py-2 cursor-pointer',
                  !n.leida_at && 'bg-muted/50'
                )}
                onClick={() => handleMarcarLeido(n.id, n.link_accion)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={cn('text-sm font-medium leading-tight', !n.leida_at && 'font-semibold')}>
                    {truncar(n.titulo, 60)}
                  </span>
                  {!n.leida_at && (
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      n.prioridad === 'critica' ? 'bg-destructive' :
                      n.prioridad === 'alta' ? 'bg-warning' :
                      'bg-primary'
                    }`} />
                  )}
                </div>
                <span className="text-xs text-muted-foreground leading-snug">
                  {truncar(n.mensaje, 80)}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {tiempoRelativo(n.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {countNoLeidos > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault()
                  void handleMarcarTodos()
                }}
              >
                {loading ? 'Marcando...' : 'Marcar todo como leido'}
              </Button>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-xs text-muted-foreground"
          onClick={() => router.push('/admin/notificaciones')}
        >
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
