'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { editarPersona } from '../../_actions'
import type { EditarPersonaInput } from '../../_lib/schemas'

interface TabDatosProps {
  persona: {
    id: string
    nombre: string
    apellido: string
    dni: string | null
    tipo_documento: string | null
    email: string | null
    email_secundario: string | null
    telefono: string | null
    whatsapp: string | null
    fecha_nacimiento: string | null
    genero: string | null
    nacionalidad: string | null
    estado_civil: string | null
    profesion: string | null
    notas: string | null
  }
}

export function TabDatos({ persona }: TabDatosProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EditarPersonaInput>({
    nombre: persona.nombre,
    apellido: persona.apellido,
    dni: persona.dni ?? '',
    tipo_documento: persona.tipo_documento ?? 'dni',
    email: persona.email ?? '',
    email_secundario: persona.email_secundario ?? '',
    telefono: persona.telefono ?? '',
    whatsapp: persona.whatsapp ?? '',
    fecha_nacimiento: persona.fecha_nacimiento ?? '',
    genero: persona.genero ?? '',
    nacionalidad: persona.nacionalidad ?? '',
    estado_civil: persona.estado_civil ?? '',
    profesion: persona.profesion ?? '',
    notas: persona.notas ?? '',
  })

  function update(field: keyof EditarPersonaInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await editarPersona(persona.id, form)
    setLoading(false)

    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos personales</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => update('nombre', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" value={form.apellido} onChange={(e) => update('apellido', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" value={form.dni} onChange={(e) => update('dni', e.target.value)} />
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_secundario">Email secundario</Label>
              <Input id="email_secundario" type="email" value={form.email_secundario} onChange={(e) => update('email_secundario', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={form.telefono} onChange={(e) => update('telefono', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha nac.</Label>
              <Input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => update('fecha_nacimiento', e.target.value)} />
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
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="no_especifica">No especifica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nacionalidad">Nacionalidad</Label>
              <Input id="nacionalidad" value={form.nacionalidad} onChange={(e) => update('nacionalidad', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_civil">Estado civil</Label>
              <Input id="estado_civil" value={form.estado_civil} onChange={(e) => update('estado_civil', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesion">Profesión</Label>
              <Input id="profesion" value={form.profesion} onChange={(e) => update('profesion', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={form.notas} onChange={(e) => update('notas', e.target.value)} rows={3} />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
