'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { enviarMensajeInterno } from '../_actions'

// Botón de mensaje interno (mensajería del portal). Abre un compositor y entrega
// el mensaje al inbox del destinatario. Convive con WhatsApp (otro botón).
export function MensajeInternoBtn({
  destinatarioPersonaId,
  destinatarioNombre,
  size = 'sm',
}: {
  destinatarioPersonaId: string
  destinatarioNombre: string
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [isPending, start] = useTransition()
  const dim = size === 'md' ? 'h-10 w-10' : 'h-8 w-8'
  const icon = size === 'md' ? 'h-4.5 w-4.5' : 'h-4 w-4'

  function enviar() {
    start(async () => {
      const r = await enviarMensajeInterno({ destinatario_persona_id: destinatarioPersonaId, asunto, cuerpo })
      if (r.ok) {
        toast.success(r.message)
        setOpen(false); setAsunto(''); setCuerpo('')
      } else {
        toast.error(r.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Enviar mensaje interno"
        className={`${dim} rounded-md border flex items-center justify-center text-primary hover:bg-accent`}
      >
        <Send className={icon} />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Mensaje a {destinatarioNombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto (opcional)" className="h-9" />
          <Textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} placeholder="Escribí tu mensaje…" rows={4} />
          <p className="text-[11px] text-muted-foreground">
            Llega a las notificaciones de {destinatarioNombre.split(' ')[0]} dentro del club.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={enviar} disabled={isPending || !cuerpo.trim()} className="w-full">
            <Send className="h-4 w-4 mr-1.5" />
            {isPending ? 'Enviando…' : 'Enviar mensaje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
