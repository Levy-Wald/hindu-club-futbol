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

interface EntidadParent {
  id: string
  nombre: string
}

interface CrearEntidadDialogProps {
  entidadesParent?: EntidadParent[]
}

export function CrearEntidadDialog({ entidadesParent = [] }: CrearEntidadDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [sitioWeb, setSitioWeb] = useState('')
  const [cuit, setCuit] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [entidadPadreId, setEntidadPadreId] = useState('')
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')

  function resetForm() {
    setTipo('')
    setNombre('')
    setTelefono('')
    setEmail('')
    setSitioWeb('')
    setCuit('')
    setRazonSocial('')
    setEntidadPadreId('')
    setCalle('')
    setNumero('')
    setCiudad('')
    setProvincia('')
    setCodigoPostal('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const direccion = (calle || numero || ciudad || provincia || codigoPostal)
        ? { calle: calle || undefined, numero: numero || undefined, ciudad: ciudad || undefined, provincia: provincia || undefined, codigo_postal: codigoPostal || undefined, pais: 'Argentina' }
        : undefined

      const result = await crearEntidad({
        tipo,
        nombre,
        telefono: telefono || undefined,
        email: email || undefined,
        sitio_web: sitioWeb || undefined,
        cuit: cuit || undefined,
        razon_social: razonSocial || undefined,
        direccion,
        entidad_padre_id: entidadPadreId || undefined,
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

          <div className="space-y-2">
            <Label htmlFor="entidad_padre_id">Entidad padre</Label>
            <Select value={entidadPadreId} onValueChange={(v) => setEntidadPadreId(v ?? '')}>
              <SelectTrigger id="entidad_padre_id">
                <SelectValue placeholder="Sin entidad padre" />
              </SelectTrigger>
              <SelectContent>
                {entidadesParent.map((ep) => (
                  <SelectItem key={ep.id} value={ep.id}>
                    {ep.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2 border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Direccion</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="calle" className="text-xs">Calle</Label>
                <Input
                  id="calle"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej: Av. Libertador"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero" className="text-xs">Numero</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 1234"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ciudad" className="text-xs">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: CABA"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="provincia" className="text-xs">Provincia</Label>
                <Input
                  id="provincia"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  placeholder="Ej: Buenos Aires"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="codigo_postal" className="text-xs">Codigo postal</Label>
                <Input
                  id="codigo_postal"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  placeholder="Ej: C1425"
                />
              </div>
            </div>
          </fieldset>

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
