'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Check, X, Banknote, Undo2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  presentarRendicion,
  aprobarRendicion,
  rechazarRendicion,
  volverABorrador,
  marcarLiquidada,
  eliminarRendicion,
} from '../../_actions'

export function RendicionAcciones({ id, estado }: { id: string; estado: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rechazoOpen, setRechazoOpen] = useState(false)
  const [motivo, setMotivo] = useState('')

  function run(fn: () => Promise<{ ok: boolean; message: string }>, redirectOnOk?: string) {
    startTransition(async () => {
      const r = await fn()
      if (r.ok) {
        toast.success(r.message)
        if (redirectOnOk) router.push(redirectOnOk)
      } else {
        toast.error(r.message)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === 'borrador' && (
        <>
          <Button size="sm" onClick={() => run(() => presentarRendicion(id))} disabled={isPending}>
            <Send className="h-4 w-4 mr-1" /> Presentar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" disabled={isPending}
            onClick={() => run(() => eliminarRendicion(id), '/admin/finanzas/rendiciones')}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </>
      )}

      {estado === 'presentada' && (
        <>
          <Button size="sm" onClick={() => run(() => aprobarRendicion(id))} disabled={isPending}>
            <Check className="h-4 w-4 mr-1" /> Aprobar
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setRechazoOpen(true)} disabled={isPending}>
            <X className="h-4 w-4 mr-1" /> Rechazar
          </Button>
        </>
      )}

      {estado === 'aprobada' && (
        <Button size="sm" onClick={() => run(() => marcarLiquidada(id))} disabled={isPending}>
          <Banknote className="h-4 w-4 mr-1" /> Marcar liquidada
        </Button>
      )}

      {estado === 'rechazada' && (
        <>
          <Button variant="outline" size="sm" onClick={() => run(() => volverABorrador(id))} disabled={isPending}>
            <Undo2 className="h-4 w-4 mr-1" /> Volver a borrador
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" disabled={isPending}
            onClick={() => run(() => eliminarRendicion(id), '/admin/finanzas/rendiciones')}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </>
      )}

      <Dialog open={rechazoOpen} onOpenChange={setRechazoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar rendición</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por qué se rechaza" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRechazoOpen(false)}>Cancelar</Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={() => { setRechazoOpen(false); run(() => rechazarRendicion(id, motivo)) }}
              >
                Rechazar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
