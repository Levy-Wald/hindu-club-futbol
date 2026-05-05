'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ExternalLink, MapPin, Save } from 'lucide-react'
import { editarEntidad } from '../../_actions'

const TIPOS_ENTIDAD = [
  'club',
  'federacion',
  'sponsor',
  'partner',
  'proveedor',
  'country',
  'escuela',
  'medico',
  'otro',
] as const

interface Direccion {
  calle?: string
  numero?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  pais?: string
}

interface EntidadInfoProps {
  entidad: {
    id: string
    tipo: string
    nombre: string
    telefono: string | null
    email: string | null
    sitio_web: string | null
    cuit: string | null
    razon_social: string | null
    direccion: Direccion | null
    entidad_padre_id: string | null
  }
  entidadesParaSelect: Array<{ id: string; nombre: string; tipo: string }>
}

export function EntidadInfo({ entidad, entidadesParaSelect }: EntidadInfoProps) {
  const [tipo, setTipo] = useState(entidad.tipo)
  const [nombre, setNombre] = useState(entidad.nombre)
  const [telefono, setTelefono] = useState(entidad.telefono ?? '')
  const [email, setEmail] = useState(entidad.email ?? '')
  const [sitioWeb, setSitioWeb] = useState(entidad.sitio_web ?? '')
  const [cuit, setCuit] = useState(entidad.cuit ?? '')
  const [razonSocial, setRazonSocial] = useState(entidad.razon_social ?? '')
  const [entidadPadreId, setEntidadPadreId] = useState(entidad.entidad_padre_id ?? '')

  // Direccion fields
  const [calle, setCalle] = useState(entidad.direccion?.calle ?? '')
  const [numero, setNumero] = useState(entidad.direccion?.numero ?? '')
  const [ciudad, setCiudad] = useState(entidad.direccion?.ciudad ?? '')
  const [provincia, setProvincia] = useState(entidad.direccion?.provincia ?? '')
  const [codigoPostal, setCodigoPostal] = useState(entidad.direccion?.codigo_postal ?? '')
  const [pais, setPais] = useState(entidad.direccion?.pais ?? '')

  const [loading, setLoading] = useState(false)

  function buildAddressString(): string {
    const parts = [calle, numero, ciudad, provincia, codigoPostal, pais].filter(Boolean)
    return parts.join(', ')
  }

  const addressString = buildAddressString()
  const hasAddress = addressString.length > 0

  async function handleSave() {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setLoading(true)

    const direccion: Direccion = {}
    if (calle) direccion.calle = calle
    if (numero) direccion.numero = numero
    if (ciudad) direccion.ciudad = ciudad
    if (provincia) direccion.provincia = provincia
    if (codigoPostal) direccion.codigo_postal = codigoPostal
    if (pais) direccion.pais = pais

    const result = await editarEntidad(entidad.id, {
      tipo,
      nombre,
      telefono,
      email,
      sitio_web: sitioWeb,
      cuit,
      razon_social: razonSocial,
      direccion: Object.keys(direccion).length > 0 ? direccion : undefined,
      entidad_padre_id: entidadPadreId || null,
    })

    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Datos generales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v ?? tipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ENTIDAD.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sitio web</Label>
              <Input value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input value={cuit} onChange={(e) => setCuit(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Razon social</Label>
              <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Entidad padre</Label>
              <Select value={entidadPadreId} onValueChange={(v) => setEntidadPadreId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin entidad padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin entidad padre</SelectItem>
                  {entidadesParaSelect.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre} ({e.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direccion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Direccion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calle</Label>
              <Input value={calle} onChange={(e) => setCalle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Numero</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input value={provincia} onChange={(e) => setProvincia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Codigo postal</Label>
              <Input value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pais</Label>
              <Input value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Argentina" />
            </div>
          </div>

          {hasAddress && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">{addressString}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://waze.com/ul?q=${encodeURIComponent(addressString)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Waze
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-1 h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
