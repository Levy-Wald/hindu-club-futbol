'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { crearSolicitudReservaSocio } from '../_actions'

interface CanchaOption {
  id: string
  nombre: string
  precio_alquiler_hora: number | null
  sede_nombre: string | null
}

export function SolicitarReserva({ canchas }: { canchas: CanchaOption[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [canchaId, setCanchaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [notas, setNotas] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await crearSolicitudReservaSocio({ cancha_id: canchaId, fecha, hora_inicio: inicio, hora_fin: fin, notas: notas || undefined })
      if (r.ok) {
        toast.success(r.message)
        setCanchaId(''); setFecha(''); setInicio(''); setFin(''); setNotas('')
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  if (canchas.length === 0) {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No hay espacios disponibles para reservar.</CardContent></Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Espacio</Label>
            <select className="w-full h-9 rounded-md border bg-transparent px-2 text-sm" value={canchaId} onChange={(e) => setCanchaId(e.target.value)} required>
              <option value="">— Elegir —</option>
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.sede_nombre ? ` · ${c.sede_nombre}` : ''}{c.precio_alquiler_hora ? ` · $${c.precio_alquiler_hora}/h` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input type="time" value={fin} onChange={(e) => setFin(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !canchaId}>
            {isPending ? 'Enviando...' : 'Solicitar reserva'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
