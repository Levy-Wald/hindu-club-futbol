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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearProveedor } from '../_actions'

export function CrearProveedorDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [sitioWeb, setSitioWeb] = useState('')

  function resetForm() {
    setNombre('')
    setCuit('')
    setRazonSocial('')
    setTelefono('')
    setEmail('')
    setSitioWeb('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await crearProveedor({
        nombre,
        cuit: cuit || undefined,
        razon_social: razonSocial || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        sitio_web: sitioWeb || undefined,
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
        Nuevo proveedor
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Distribuidora Deportiva S.A."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="razon_social">Razón social</Label>
              <Input
                id="razon_social"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej: Distribuidora Deportiva S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
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
                placeholder="Ej: ventas@proveedor.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sitio_web">Sitio web</Label>
              <Input
                id="sitio_web"
                value={sitioWeb}
                onChange={(e) => setSitioWeb(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !nombre}>
              {isPending ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
