'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Briefcase, Save, Loader2 } from 'lucide-react'
import { guardarDatosLaborales } from '@/app/admin/rrhh/_actions'
import { fetchDatosLaborales, fetchCatalogosLaborales } from '@/app/admin/rrhh/_lib/queries'
import { toast } from 'sonner'

interface DatosLaboralesProps {
  personaId: string
}

interface Catalogo { slug: string; nombre: string }

export function SeccionDatosLaborales({ personaId }: DatosLaboralesProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)

  // Catalogos
  const [areas, setAreas] = useState<Catalogo[]>([])
  const [puestos, setPuestos] = useState<Catalogo[]>([])
  const [roles, setRoles] = useState<Catalogo[]>([])
  const [obrasSociales, setObrasSociales] = useState<Catalogo[]>([])

  // Form state
  const [areaTrabajo, setAreaTrabajo] = useState('')
  const [puesto, setPuesto] = useState('')
  const [rolLaboral, setRolLaboral] = useState('')
  const [legajo, setLegajo] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [sindicato, setSindicato] = useState('')

  useEffect(() => {
    async function load() {
      const [datos, catalogos] = await Promise.all([
        fetchDatosLaborales(personaId),
        fetchCatalogosLaborales(),
      ])
      setAreas(catalogos.areas)
      setPuestos(catalogos.puestos)
      setRoles(catalogos.roles)
      setObrasSociales(catalogos.obrasSociales)

      if (datos) {
        setAreaTrabajo(datos.area_trabajo_slug ?? '')
        setPuesto(datos.puesto_slug ?? '')
        setRolLaboral(datos.rol_laboral_slug ?? '')
        setLegajo(datos.numero_legajo ?? '')
        setObraSocial(datos.obra_social_slug ?? '')
        setSindicato(datos.sindicato ?? '')
      }
      setLoaded(true)
    }
    load()
  }, [personaId])

  function handleSave() {
    const formData = new FormData()
    if (areaTrabajo) formData.set('area_trabajo_slug', areaTrabajo)
    if (puesto) formData.set('puesto_slug', puesto)
    if (rolLaboral) formData.set('rol_laboral_slug', rolLaboral)
    if (legajo) formData.set('numero_legajo', legajo)
    if (obraSocial) formData.set('obra_social_slug', obraSocial)
    if (sindicato) formData.set('sindicato', sindicato)

    startTransition(async () => {
      const result = await guardarDatosLaborales(personaId, formData)
      if (result.success) {
        toast.success('Datos laborales guardados')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al guardar')
      }
    })
  }

  if (!loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Datos laborales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Datos laborales
          </CardTitle>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Guardar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Area de trabajo</Label>
            <Select value={areaTrabajo || '_none'} onValueChange={(v) => setAreaTrabajo(!v || v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin asignar</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.slug} value={a.slug}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Puesto</Label>
            <Select value={puesto || '_none'} onValueChange={(v) => setPuesto(!v || v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin asignar</SelectItem>
                {puestos.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Rol laboral</Label>
            <Select value={rolLaboral || '_none'} onValueChange={(v) => setRolLaboral(!v || v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin asignar</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Numero de legajo</Label>
            <Input value={legajo} onChange={(e) => setLegajo(e.target.value)} placeholder="Ej: LEG-001" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Obra social laboral</Label>
            <Select value={obraSocial || '_none'} onValueChange={(v) => setObraSocial(!v || v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin asignar</SelectItem>
                {obrasSociales.map((o) => (
                  <SelectItem key={o.slug} value={o.slug}>{o.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Sindicato</Label>
            <Input value={sindicato} onChange={(e) => setSindicato(e.target.value)} placeholder="Ej: UPCN" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
