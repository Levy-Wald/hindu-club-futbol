'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { editarMiContacto } from '../_actions'

interface Props {
  email: string | null
  telefono: string | null
  whatsapp: string | null
}

export function EditarContactoDialog({ email, telefono, whatsapp }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [emailV, setEmailV] = useState(email ?? '')
  const [telV, setTelV] = useState(telefono ?? '')
  const [waV, setWaV] = useState(whatsapp ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await editarMiContacto({ email_principal: emailV, telefono_principal: telV, whatsapp: waV })
      if (r.ok) {
        toast.success(r.message)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4 mr-1" />
        Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar datos de contacto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={emailV} onChange={(e) => setEmailV(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">Teléfono</Label>
            <Input id="tel" value={telV} onChange={(e) => setTelV(e.target.value)} placeholder="+54 11 ..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa">WhatsApp</Label>
            <Input id="wa" value={waV} onChange={(e) => setWaV(e.target.value)} placeholder="+54 9 11 ..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
