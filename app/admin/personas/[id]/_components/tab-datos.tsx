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
    tipo_documento: string
    numero_documento: string
    email_principal: string | null
    telefono_principal: string | null
    whatsapp: string | null
    fecha_nacimiento: string | null
    genero: string | null
    nacionalidad: string | null
    profesion_ocupacion: string | null
    notas_internas: string | null
  }
}

export function TabDatos({ persona }: TabDatosProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EditarPersonaInput>({
    nombre: persona.nombre,
    apellido: persona.apellido,
    tipo_documento: persona.tipo_documento,
    numero_documento: persona.numero_documento,
    email_principal: persona.email_principal ?? '',
    telefono_principal: persona.telefono_principal ?? '',
    whatsapp: persona.whatsapp ?? '',
    fecha_nacimiento: persona.fecha_nacimiento ?? '',
    genero: persona.genero ?? '',
    nacionalidad: persona.nacionalidad ?? '',
    profesion_ocupacion: persona.profesion_ocupacion ?? '',
    notas_internas: persona.notas_internas ?? '',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => update('nombre', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" value={form.apellido} onChange={(e) => update('apellido', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Documento *</Label>
              <Input id="numero_documento" value={form.numero_documento} onChange={(e) => update('numero_documento', e.target.value)} required />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_principal">Email</Label>
              <Input id="email_principal" type="email" value={form.email_principal} onChange={(e) => update('email_principal', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono_principal">Teléfono</Label>
              <Input id="telefono_principal" value={form.telefono_principal} onChange={(e) => update('telefono_principal', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha nac.</Label>
              <Input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => update('fecha_nacimiento', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="nacionalidad">Nacionalidad</Label>
              <Input id="nacionalidad" value={form.nacionalidad} onChange={(e) => update('nacionalidad', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesion_ocupacion">Profesión</Label>
              <Input id="profesion_ocupacion" value={form.profesion_ocupacion} onChange={(e) => update('profesion_ocupacion', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_internas">Notas internas</Label>
            <Textarea id="notas_internas" value={form.notas_internas} onChange={(e) => update('notas_internas', e.target.value)} rows={3} />
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
