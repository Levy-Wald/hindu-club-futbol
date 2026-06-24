'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { responderInvitacionAction } from '@/modules/eventos/lib/actions'

const ESTADO_LABEL: Record<string, string> = { aceptado: 'Vas a ir', rechazado: 'No vas', tentativa: 'Tal vez' }

export function ResponderInvitacion({ invitadoId, estadoInicial }: { invitadoId: string; estadoInicial: string | null }) {
  const router = useRouter()
  const [estado, setEstado] = useState(estadoInicial)
  const [isPending, startTransition] = useTransition()

  function responder(nuevo: 'aceptado' | 'rechazado') {
    startTransition(async () => {
      const r = await responderInvitacionAction({ evento_invitado_id: invitadoId, estado: nuevo })
      if (r.ok) {
        setEstado(nuevo)
        toast.success(nuevo === 'aceptado' ? 'Confirmaste tu asistencia' : 'Marcaste que no vas')
        router.refresh()
      } else {
        toast.error('No se pudo guardar, reintentá')
      }
    })
  }

  if (estado && estado !== 'pendiente') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={estado === 'aceptado' ? 'default' : estado === 'rechazado' ? 'destructive' : 'outline'}>
          {ESTADO_LABEL[estado] ?? estado}
        </Badge>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => responder(estado === 'aceptado' ? 'rechazado' : 'aceptado')}>
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" disabled={isPending} onClick={() => responder('rechazado')}>
        <X className="h-4 w-4 mr-1" /> No voy
      </Button>
      <Button size="sm" className="flex-1" disabled={isPending} onClick={() => responder('aceptado')}>
        <Check className="h-4 w-4 mr-1" /> Voy a ir
      </Button>
    </div>
  )
}
