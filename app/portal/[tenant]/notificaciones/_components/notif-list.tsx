'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCheck, Bell } from 'lucide-react'
import { marcarComoLeida, marcarTodasComoLeidas } from '@/modules/notificaciones/lib/actions'

interface NotifRow {
  id: string
  titulo: string
  mensaje: string | null
  prioridad: string | null
  leida_at: string | null
  created_at: string
}

export function NotifList({ initial }: { initial: NotifRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const hayNoLeidas = rows.some((r) => !r.leida_at)

  function leer(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, leida_at: new Date().toISOString() } : r)))
    startTransition(async () => {
      await marcarComoLeida(id)
      router.refresh()
    })
  }

  function leerTodas() {
    setRows((prev) => prev.map((r) => ({ ...r, leida_at: r.leida_at ?? new Date().toISOString() })))
    startTransition(async () => {
      await marcarTodasComoLeidas()
      router.refresh()
    })
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No tenés notificaciones.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {hayNoLeidas && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={leerTodas} disabled={isPending}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((n) => {
          const noLeida = !n.leida_at
          return (
            <Card
              key={n.id}
              className={noLeida ? 'border-primary/40 bg-primary/5 cursor-pointer' : 'cursor-pointer'}
              onClick={() => noLeida && leer(n.id)}
            >
              <CardContent className="p-3 flex gap-3">
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${noLeida ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  {n.mensaje && <p className="text-sm text-muted-foreground">{n.mensaje}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
