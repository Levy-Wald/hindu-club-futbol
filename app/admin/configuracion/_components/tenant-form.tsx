'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Building2, MapPin, Phone, Globe, Save, Loader2, Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { actualizarTenant } from '../_actions'

interface TenantFormProps {
  tenant: {
    id: string
    nombre: string
    slug: string
    tipo: string
    plan_slug: string
    dominio_custom: string | null
    configuracion: Record<string, unknown> | null
    idioma_default: string | null
    timezone: string | null
    activo: boolean
  }
}

const TIPOS_ORGANIZACION = [
  { value: 'club_deportivo', label: 'Club Deportivo' },
  { value: 'country', label: 'Country' },
  { value: 'federacion', label: 'Federacion' },
  { value: 'escuela_deportiva', label: 'Escuela Deportiva' },
  { value: 'capitan_amateur', label: 'Capitan Amateur' },
]

const IDIOMAS = [
  { value: 'es-AR', label: 'Espanol (Argentina)' },
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'pt-BR', label: 'Portugues (Brasil)' },
]

const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Argentina/Cordoba', label: 'Argentina (Cordoba)' },
  { value: 'America/Argentina/Mendoza', label: 'Argentina (Mendoza)' },
  { value: 'America/Montevideo', label: 'Uruguay (Montevideo)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (Sao Paulo)' },
  { value: 'America/Lima', label: 'Peru (Lima)' },
  { value: 'America/Bogota', label: 'Colombia (Bogota)' },
  { value: 'America/Mexico_City', label: 'Mexico (Ciudad de Mexico)' },
  { value: 'America/Caracas', label: 'Venezuela (Caracas)' },
  { value: 'America/La_Paz', label: 'Bolivia (La Paz)' },
  { value: 'America/Asuncion', label: 'Paraguay (Asuncion)' },
  { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil)' },
]

const MONEDAS = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dolar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  light: 'Light',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export function TenantForm({ tenant }: TenantFormProps) {
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    nombre: tenant.nombre,
    tipo: tenant.tipo,
    idioma_default: tenant.idioma_default ?? 'es-AR',
    timezone: tenant.timezone ?? 'America/Argentina/Buenos_Aires',
    razon_social: (tenant.configuracion as any)?.razon_social ?? '',
    cuit: (tenant.configuracion as any)?.cuit ?? '',
    email_institucional: (tenant.configuracion as any)?.email_institucional ?? '',
    telefono_institucional: (tenant.configuracion as any)?.telefono_institucional ?? '',
    sitio_web: (tenant.configuracion as any)?.sitio_web ?? '',
    moneda_principal: (tenant.configuracion as any)?.moneda_principal ?? 'ARS',
    direccion_fiscal: {
      calle: (tenant.configuracion as any)?.direccion_fiscal?.calle ?? '',
      localidad: (tenant.configuracion as any)?.direccion_fiscal?.localidad ?? '',
      provincia: (tenant.configuracion as any)?.direccion_fiscal?.provincia ?? '',
      codigo_postal: (tenant.configuracion as any)?.direccion_fiscal?.codigo_postal ?? '',
      pais: (tenant.configuracion as any)?.direccion_fiscal?.pais ?? 'Argentina',
    },
  })

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function updateDireccion(field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      direccion_fiscal: { ...prev.direccion_fiscal, [field]: value },
    }))
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await actualizarTenant({
        nombre: formData.nombre,
        tipo: formData.tipo,
        idioma_default: formData.idioma_default,
        timezone: formData.timezone,
        configuracion: {
          ...(tenant.configuracion ?? {}),
          razon_social: formData.razon_social,
          cuit: formData.cuit,
          email_institucional: formData.email_institucional,
          telefono_institucional: formData.telefono_institucional,
          sitio_web: formData.sitio_web,
          moneda_principal: formData.moneda_principal,
          direccion_fiscal: formData.direccion_fiscal,
        },
      })
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Card 1: Datos institucionales */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Datos institucionales</CardTitle>
          </div>
          <CardDescription>
            Informacion basica de la organizacion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="nombre">Nombre de la organizacion *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Ej: Hindu Club"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={tenant.slug}
                readOnly
                className="font-mono bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razon social</Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) => updateField('razon_social', e.target.value)}
                placeholder="Ej: Club Atletico Hindu S.A."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT/CUIL</Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => updateField('cuit', e.target.value)}
                placeholder="XX-XXXXXXXX-X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de organizacion</Label>
              <Select
                value={formData.tipo}
                onValueChange={(val) => updateField('tipo', val ?? formData.tipo)}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ORGANIZACION.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Direccion fiscal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Direccion fiscal</CardTitle>
          </div>
          <CardDescription>
            Domicilio legal de la organizacion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="calle">Calle y numero</Label>
              <Input
                id="calle"
                value={formData.direccion_fiscal.calle}
                onChange={(e) => updateDireccion('calle', e.target.value)}
                placeholder="Ej: Av. Figueroa Alcorta 7285"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad</Label>
              <Input
                id="localidad"
                value={formData.direccion_fiscal.localidad}
                onChange={(e) => updateDireccion('localidad', e.target.value)}
                placeholder="Ej: CABA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={formData.direccion_fiscal.provincia}
                onChange={(e) => updateDireccion('provincia', e.target.value)}
                placeholder="Ej: Buenos Aires"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Codigo postal</Label>
              <Input
                id="codigo_postal"
                value={formData.direccion_fiscal.codigo_postal}
                onChange={(e) => updateDireccion('codigo_postal', e.target.value)}
                placeholder="Ej: C1428"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">Pais</Label>
              <Input
                id="pais"
                value={formData.direccion_fiscal.pais}
                onChange={(e) => updateDireccion('pais', e.target.value)}
                placeholder="Argentina"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Contacto institucional */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Contacto institucional</CardTitle>
          </div>
          <CardDescription>
            Datos de contacto oficiales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email_institucional">Email institucional</Label>
              <Input
                id="email_institucional"
                type="email"
                value={formData.email_institucional}
                onChange={(e) => updateField('email_institucional', e.target.value)}
                placeholder="info@hinduclub.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono_institucional">Telefono institucional</Label>
              <Input
                id="telefono_institucional"
                type="tel"
                value={formData.telefono_institucional}
                onChange={(e) => updateField('telefono_institucional', e.target.value)}
                placeholder="+54 11 4xxx-xxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio web</Label>
              <Input
                id="sitio_web"
                type="url"
                value={formData.sitio_web}
                onChange={(e) => updateField('sitio_web', e.target.value)}
                placeholder="https://www.hinduclub.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Configuracion regional */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Configuracion regional</CardTitle>
          </div>
          <CardDescription>
            Idioma, zona horaria y moneda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="idioma">Idioma</Label>
              <Select
                value={formData.idioma_default}
                onValueChange={(val) => updateField('idioma_default', val ?? formData.idioma_default)}
              >
                <SelectTrigger id="idioma">
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {IDIOMAS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select
                value={formData.timezone}
                onValueChange={(val) => updateField('timezone', val ?? formData.timezone)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Seleccionar zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda principal</Label>
              <Select
                value={formData.moneda_principal}
                onValueChange={(val) => updateField('moneda_principal', val ?? formData.moneda_principal)}
              >
                <SelectTrigger id="moneda">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Plan y suscripcion */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Plan y suscripcion</CardTitle>
          </div>
          <CardDescription>
            Informacion de tu plan actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Plan actual</Label>
              <div>
                <Badge variant="secondary" className="text-sm">
                  {PLAN_LABELS[tenant.plan_slug] ?? tenant.plan_slug}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <div>
                <Badge variant={tenant.activo ? 'default' : 'destructive'} className="text-sm">
                  {tenant.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dominio custom</Label>
              <p className="text-sm text-muted-foreground pt-1">
                {tenant.dominio_custom ?? 'No configurado'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row pt-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Solicitud de cambio de plan enviada. Nos pondremos en contacto.')}
            >
              Solicitar cambio de plan
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Solicitud de soporte enviada. Te responderemos a la brevedad.')}
            >
              Solicitar soporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Boton guardar fijo */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="mx-auto flex max-w-4xl justify-end">
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
