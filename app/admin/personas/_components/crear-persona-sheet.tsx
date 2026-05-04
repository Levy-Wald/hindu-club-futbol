'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { crearPersona } from '../_actions'
import type { CrearPersonaInput } from '../_lib/schemas'

const INITIAL: CrearPersonaInput = {
  nombre: '',
  apellido: '',
  tipo_documento: 'dni',
  numero_documento: '',
  email_principal: '',
  telefono_principal: '',
  whatsapp: '',
  fecha_nacimiento: '',
  genero: '',
  nacionalidad: '',
}

export function CrearPersonaSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CrearPersonaInput>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: keyof CrearPersonaInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!form.nombre.trim()) {
      setErrors((prev) => ({ ...prev, nombre: 'El nombre es obligatorio' }))
      return
    }
    if (!form.apellido.trim()) {
      setErrors((prev) => ({ ...prev, apellido: 'El apellido es obligatorio' }))
      return
    }
    if (!form.numero_documento.trim()) {
      setErrors((prev) => ({ ...prev, numero_documento: 'El documento es obligatorio' }))
      return
    }

    setLoading(true)
    const result = await crearPersona(form)
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      setForm(INITIAL)
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva persona
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nueva persona</SheetTitle>
          <SheetDescription>
            Completá los datos básicos. Nombre, apellido y documento son obligatorios.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
              />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={form.apellido}
                onChange={(e) => update('apellido', e.target.value)}
              />
              {errors.apellido && <p className="text-sm text-destructive">{errors.apellido}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Documento *</Label>
              <Input
                id="numero_documento"
                value={form.numero_documento}
                onChange={(e) => update('numero_documento', e.target.value)}
              />
              {errors.numero_documento && <p className="text-sm text-destructive">{errors.numero_documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo doc.</Label>
              <Select value={form.tipo_documento} onValueChange={(v) => update('tipo_documento', v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="pasaporte">Pasaporte</SelectItem>
                  <SelectItem value="cedula">Cédula</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_principal">Email</Label>
            <Input
              id="email_principal"
              type="email"
              value={form.email_principal}
              onChange={(e) => update('email_principal', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono_principal">Teléfono</Label>
              <Input
                id="telefono_principal"
                value={form.telefono_principal}
                onChange={(e) => update('telefono_principal', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha nac.</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => update('fecha_nacimiento', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genero">Género</Label>
              <Select value={form.genero} onValueChange={(v) => update('genero', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="no_binario">No binario</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="prefiere_no_decir">Prefiere no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nacionalidad">Nacionalidad</Label>
            <Input
              id="nacionalidad"
              value={form.nacionalidad}
              onChange={(e) => update('nacionalidad', e.target.value)}
              placeholder="AR"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear persona
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
