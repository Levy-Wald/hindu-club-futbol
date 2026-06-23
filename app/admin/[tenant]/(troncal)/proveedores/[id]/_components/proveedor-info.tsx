'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ExternalLink, MapPin, Save } from 'lucide-react'
import { editarProveedor } from '../../_actions'

interface Direccion {
  calle?: string
  numero?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  pais?: string
}

interface ProveedorInfoProps {
  proveedor: {
    id: string
    nombre: string
    cuit: string | null
    razon_social: string | null
    telefono: string | null
    email: string | null
    sitio_web: string | null
    direccion: Direccion | null
  }
}

export function ProveedorInfo({ proveedor }: ProveedorInfoProps) {
  const [nombre, setNombre] = useState(proveedor.nombre)
  const [cuit, setCuit] = useState(proveedor.cuit ?? '')
  const [razonSocial, setRazonSocial] = useState(proveedor.razon_social ?? '')
  const [telefono, setTelefono] = useState(proveedor.telefono ?? '')
  const [email, setEmail] = useState(proveedor.email ?? '')
  const [sitioWeb, setSitioWeb] = useState(proveedor.sitio_web ?? '')

  const [calle, setCalle] = useState(proveedor.direccion?.calle ?? '')
  const [numero, setNumero] = useState(proveedor.direccion?.numero ?? '')
  const [ciudad, setCiudad] = useState(proveedor.direccion?.ciudad ?? '')
  const [provincia, setProvincia] = useState(proveedor.direccion?.provincia ?? '')
  const [codigoPostal, setCodigoPostal] = useState(proveedor.direccion?.codigo_postal ?? '')
  const [pais, setPais] = useState(proveedor.direccion?.pais ?? '')

  const [loading, setLoading] = useState(false)

  const addressString = [calle, numero, ciudad, provincia, codigoPostal, pais].filter(Boolean).join(', ')
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

    const result = await editarProveedor(proveedor.id, {
      nombre,
      cuit,
      razon_social: razonSocial,
      telefono,
      email,
      sitio_web: sitioWeb,
      direccion: Object.keys(direccion).length > 0 ? direccion : undefined,
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input value={cuit} onChange={(e) => setCuit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Razón social</Label>
              <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Sitio web</Label>
              <Input value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} placeholder="https://" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dirección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calle</Label>
              <Input value={calle} onChange={(e) => setCalle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
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
              <Label>Código postal</Label>
              <Input value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
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
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-1 h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
