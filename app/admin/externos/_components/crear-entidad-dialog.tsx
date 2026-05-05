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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearEntidad } from '../_actions'

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

export function CrearEntidadDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [sitioWeb, setSitioWeb] = useState('')
  const [cuit, setCuit] = useState('')
  const [razonSocial, setRazonSocial] = useState('')

  function resetForm() {
    setTipo('')
    setNombre('')
    setTelefono('')
    setEmail('')
    setSitioWeb('')
    setCuit('')
    setRazonSocial('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await crearEntidad({
        tipo,
        nombre,
        telefono: telefono || undefined,
        email: email || undefined,
        sitio_web: sitioWeb || undefined,
        cuit: cuit || undefined,
        razon_social: razonSocial || undefined,
      })

      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva entidad
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva entidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v ?? '')}>
              <SelectTrigger id="tipo">
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
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Club Atletico River Plate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: +54 11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: contacto@entidad.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitio_web">Sitio web</Label>
            <Input
              id="sitio_web"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
              placeholder="Ej: https://www.entidad.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="Ej: 30-12345678-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razon_social">Razon social</Label>
            <Input
              id="razon_social"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Ej: Entidad S.A."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !tipo || !nombre}>
              {isPending ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
