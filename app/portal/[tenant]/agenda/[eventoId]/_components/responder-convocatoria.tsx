'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { responderConvocatoria } from '../_actions'

type Respuesta = 'aceptado' | 'rechazado' | 'tentativa'

const OPCIONES: { value: Respuesta; label: string; icon: typeof Check; activeCls: string }[] = [
  { value: 'aceptado', label: 'Voy a ir', icon: Check, activeCls: 'bg-green-600 text-white border-green-600' },
  { value: 'tentativa', label: 'En duda', icon: HelpCircle, activeCls: 'bg-amber-500 text-white border-amber-500' },
  { value: 'rechazado', label: 'No puedo', icon: X, activeCls: 'bg-red-600 text-white border-red-600' },
]

export function ResponderConvocatoria({
  eventoId,
  estadoConvocatoria,
  respuestaInicial,
  motivoInicial,
}: {
  eventoId: string
  estadoConvocatoria: string
  respuestaInicial: string | null
  motivoInicial: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sel, setSel] = useState<Respuesta | null>(
    respuestaInicial && respuestaInicial !== 'pendiente' ? (respuestaInicial as Respuesta) : null,
  )
  const [motivo, setMotivo] = useState(motivoInicial ?? '')

  function responder(r: Respuesta) {
    setSel(r)
    // "No puedo" / "En duda" piden motivo: no enviamos hasta que confirme.
    if (r === 'aceptado') enviar(r, '')
  }

  function enviar(r: Respuesta, motivoTxt: string) {
    startTransition(async () => {
      const res = await responderConvocatoria(eventoId, r, motivoTxt || undefined)
      if (res.ok) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const estadoLabel = estadoConvocatoria === 'titular' ? 'Titular'
    : estadoConvocatoria === 'suplente' ? 'Suplente' : 'Convocado'

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Te convocaron como <b>{estadoLabel}</b></p>
        {respuestaInicial && respuestaInicial !== 'pendiente' && (
          <span className="text-xs text-muted-foreground">
            {respuestaInicial === 'aceptado' ? 'Confirmaste' : respuestaInicial === 'rechazado' ? 'No vas' : 'En duda'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPCIONES.map((o) => {
          const Icon = o.icon
          const active = sel === o.value
          return (
            <button
              key={o.value}
              type="button"
              disabled={isPending}
              onClick={() => responder(o.value)}
              className={`flex flex-col items-center gap-1 rounded-md border py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                active ? o.activeCls : 'hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {o.label}
            </button>
          )
        })}
      </div>

      {/* Motivo para "No puedo" / "En duda" */}
      {(sel === 'rechazado' || sel === 'tentativa') && (
        <div className="space-y-2">
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={sel === 'rechazado' ? 'Motivo (lesión, viaje, etc.)' : 'Comentario (opcional)'}
            className="h-9"
          />
          <Button size="sm" className="w-full" disabled={isPending} onClick={() => enviar(sel, motivo)}>
            {isPending ? 'Enviando…' : 'Enviar respuesta al cuerpo técnico'}
          </Button>
        </div>
      )}
    </div>
  )
}
