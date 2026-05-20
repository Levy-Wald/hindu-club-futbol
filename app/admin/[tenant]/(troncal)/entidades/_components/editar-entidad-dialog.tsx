'use client'

import { useState, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { editarEntidad } from '../_actions'

const TIPOS_ENTIDAD = [
  { value: 'club', label: 'Club' },
  { value: 'federacion', label: 'Federacion' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'partner', label: 'Partner' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'country', label: 'Country' },
  { value: 'escuela', label: 'Escuela' },
  { value: 'medico', label: 'Medico' },
  { value: 'otro', label: 'Otro' },
]

interface Entidad {
  id: string
  nombre: string
  tipo: string
  telefono: string | null
  email: string | null
  sitio_web: string | null
  cuit: string | null
  razon_social?: string | null
}

interface EditarEntidadDialogProps {
  entidad: Entidad
}

export function EditarEntidadDialog({ entidad }: EditarEntidadDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo] = useState(entidad.tipo)
  const [nombre, setNombre] = useState(entidad.nombre)
  const [telefono, setTelefono] = useState(entidad.telefono ?? '')
  const [email, setEmail] = useState(entidad.email ?? '')
  const [sitioWeb, setSitioWeb] = useState(entidad.sitio_web ?? '')
  const [cuit, setCuit] = useState(entidad.cuit ?? '')
  const [razonSocial, setRazonSocial] = useState(entidad.razon_social ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await editarEntidad(entidad.id, {
        tipo,
        nombre,
        telefono,
        email,
        sitio_web: sitioWeb,
        cuit,
        razon_social: razonSocial,
      })

      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar entidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v ?? '')}>
              <SelectTrigger id="edit-tipo">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ENTIDAD.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <Input id="edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-telefono">Telefono</Label>
            <Input id="edit-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sitio_web">Sitio web</Label>
            <Input id="edit-sitio_web" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cuit">CUIT</Label>
            <Input id="edit-cuit" value={cuit} onChange={(e) => setCuit(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-razon_social">Razon social</Label>
            <Input id="edit-razon_social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !tipo || !nombre}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
