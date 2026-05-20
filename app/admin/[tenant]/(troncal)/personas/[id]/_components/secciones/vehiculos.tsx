'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Car, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface Vehiculo {
  id: string
  tipo_vehiculo_slug: string | null
  marca: string
  modelo: string
  año: number | null
  patente: string
  pais_patente: string
  color: string | null
  combustible: string | null
  seguro_compania_slug: string | null
  seguro_compania_otra: string | null
  seguro_numero_poliza: string | null
  seguro_tipo_cobertura: string | null
  seguro_vigencia_desde: string | null
  seguro_vigencia_hasta: string | null
  tipo_titularidad: string | null
  titular_nombre: string | null
  titular_dni: string | null
  permite_ingreso_club: boolean
  lugar_estacionamiento_asignado: string | null
  tag_rfid_estacionamiento: string | null
  notas: string | null
  activo: boolean
}

interface CatalogoItem {
  slug: string
  nombre: string
}

interface SeccionVehiculosProps {
  personaId: string
  tenantId: string
}

// --- Helpers ---

function getEstadoSeguro(desde: string | null, hasta: string | null): 'vigente' | 'por_vencer' | 'vencido' | 'sin_fecha' {
  if (!hasta) return 'sin_fecha'
  const hoy = new Date()
  const venc = new Date(hasta)
  if (venc < hoy) return 'vencido'
  const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'por_vencer'
  return 'vigente'
}

function BadgeSeguro({ desde, hasta }: { desde: string | null; hasta: string | null }) {
  const estado = getEstadoSeguro(desde, hasta)
  switch (estado) {
    case 'vigente':
      return <Badge variant="outline" className="border-success-500 text-success-600 dark:text-success-400">Seguro vigente</Badge>
    case 'por_vencer':
      return <Badge variant="outline" className="border-warning-500 text-warning-600 dark:text-warning-400">Seguro por vencer</Badge>
    case 'vencido':
      return <Badge variant="outline" className="border-error-500 text-error-600 dark:text-error-400">Seguro vencido</Badge>
    default:
      return null
  }
}

const EMPTY_FORM = {
  tipo_vehiculo_slug: '',
  marca: '',
  modelo: '',
  año: '',
  patente: '',
  pais_patente: 'AR',
  color: '',
  combustible: '',
  seguro_compania_slug: '',
  seguro_compania_otra: '',
  seguro_numero_poliza: '',
  seguro_tipo_cobertura: '',
  seguro_vigencia_desde: '',
  seguro_vigencia_hasta: '',
  tipo_titularidad: '',
  titular_nombre: '',
  titular_dni: '',
  permite_ingreso_club: true,
  lugar_estacionamiento_asignado: '',
  tag_rfid_estacionamiento: '',
  notas: '',
}

// --- Main Component ---

export function SeccionVehiculos({ personaId, tenantId }: SeccionVehiculosProps) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogoItem[]>([])
  const [companiasSeguro, setCompaniasSeguro] = useState<CatalogoItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [vehiculosRes, tiposRes, companiasRes] = await Promise.all([
        supabase
          .from('personas_vehiculos')
          .select('*')
          .eq('persona_id', personaId)
          .eq('activo', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('catalogo_tipos_vehiculo')
          .select('slug, nombre')
          .eq('activo', true)
          .order('orden'),
        supabase
          .from('catalogo_companias_seguro')
          .select('slug, nombre')
          .eq('activo', true)
          .order('nombre'),
      ])

      if (vehiculosRes.error) {
        toast.error(`Error cargando vehículos: ${vehiculosRes.error.message}`)
      } else {
        setVehiculos(vehiculosRes.data ?? [])
      }
      setTiposVehiculo(tiposRes.data ?? [])
      setCompaniasSeguro(companiasRes.data ?? [])
      setLoaded(true)
    }
    load()
  }, [personaId])

  async function saveVehiculo() {
    if (!form.marca || !form.modelo || !form.patente) {
      toast.error('Marca, modelo y patente son obligatorios')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('personas_vehiculos')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        tipo_vehiculo_slug: form.tipo_vehiculo_slug || null,
        marca: form.marca,
        modelo: form.modelo,
        año: form.año ? parseInt(form.año) : null,
        patente: form.patente,
        pais_patente: form.pais_patente || 'AR',
        color: form.color || null,
        combustible: form.combustible || null,
        seguro_compania_slug: form.seguro_compania_slug || null,
        seguro_compania_otra: form.seguro_compania_otra || null,
        seguro_numero_poliza: form.seguro_numero_poliza || null,
        seguro_tipo_cobertura: form.seguro_tipo_cobertura || null,
        seguro_vigencia_desde: form.seguro_vigencia_desde || null,
        seguro_vigencia_hasta: form.seguro_vigencia_hasta || null,
        tipo_titularidad: form.tipo_titularidad || null,
        titular_nombre: form.titular_nombre || null,
        titular_dni: form.titular_dni || null,
        permite_ingreso_club: form.permite_ingreso_club,
        lugar_estacionamiento_asignado: form.lugar_estacionamiento_asignado || null,
        tag_rfid_estacionamiento: form.tag_rfid_estacionamiento || null,
        notas: form.notas || null,
        activo: true,
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      setVehiculos((prev) => [data, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Vehículo registrado')
    }
  }

  async function deleteVehiculo(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('personas_vehiculos')
      .update({ activo: false })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      setVehiculos((prev) => prev.filter((v) => v.id !== id))
      toast.success('Vehículo eliminado')
    }
  }

  function getTipoLabel(slug: string | null) {
    if (!slug) return null
    return tiposVehiculo.find((t) => t.slug === slug)?.nombre ?? slug
  }

  function getCompaniaLabel(slug: string | null, otra: string | null) {
    if (otra) return otra
    if (!slug) return null
    return companiasSeguro.find((c) => c.slug === slug)?.nombre ?? slug
  }

  if (!loaded) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Cargando vehículos...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="h-4 w-4" />
          Vehículos
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario nuevo vehículo */}
        {showForm && (
          <div className="rounded-md border p-4 space-y-4 bg-muted/20">
            {/* Datos del vehículo */}
            <p className="text-sm font-medium text-muted-foreground">Datos del vehículo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tipo</Label>
                <Select value={form.tipo_vehiculo_slug} onValueChange={(v) => setForm((p) => ({ ...p, tipo_vehiculo_slug: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {tiposVehiculo.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Marca *</Label>
                <Input value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} placeholder="Toyota" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Modelo *</Label>
                <Input value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} placeholder="Corolla" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Año</Label>
                <Input type="number" value={form.año} onChange={(e) => setForm((p) => ({ ...p, año: e.target.value }))} placeholder="2022" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Patente *</Label>
                <Input value={form.patente} onChange={(e) => setForm((p) => ({ ...p, patente: e.target.value }))} placeholder="AB123CD" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">País patente</Label>
                <Input value={form.pais_patente} onChange={(e) => setForm((p) => ({ ...p, pais_patente: e.target.value }))} placeholder="AR" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Color</Label>
                <Input value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} placeholder="Blanco" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Combustible</Label>
                <Input value={form.combustible} onChange={(e) => setForm((p) => ({ ...p, combustible: e.target.value }))} placeholder="Nafta" />
              </div>
            </div>

            {/* Seguro */}
            <p className="text-sm font-medium text-muted-foreground pt-2">Seguro</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Compañía</Label>
                <Select value={form.seguro_compania_slug} onValueChange={(v) => setForm((p) => ({ ...p, seguro_compania_slug: v ?? '', seguro_compania_otra: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__otra">Otra (especificar)</SelectItem>
                    {companiasSeguro.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.seguro_compania_slug === '__otra' && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Nombre compañía</Label>
                  <Input value={form.seguro_compania_otra} onChange={(e) => setForm((p) => ({ ...p, seguro_compania_otra: e.target.value }))} placeholder="Nombre" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">N° póliza</Label>
                <Input value={form.seguro_numero_poliza} onChange={(e) => setForm((p) => ({ ...p, seguro_numero_poliza: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tipo cobertura</Label>
                <Input value={form.seguro_tipo_cobertura} onChange={(e) => setForm((p) => ({ ...p, seguro_tipo_cobertura: e.target.value }))} placeholder="Terceros completo" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Vigencia desde</Label>
                <Input type="date" value={form.seguro_vigencia_desde} onChange={(e) => setForm((p) => ({ ...p, seguro_vigencia_desde: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Vigencia hasta</Label>
                <Input type="date" value={form.seguro_vigencia_hasta} onChange={(e) => setForm((p) => ({ ...p, seguro_vigencia_hasta: e.target.value }))} />
              </div>
            </div>

            {/* Titularidad */}
            <p className="text-sm font-medium text-muted-foreground pt-2">Titularidad</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tipo</Label>
                <Select value={form.tipo_titularidad} onValueChange={(v) => setForm((p) => ({ ...p, tipo_titularidad: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titular">Titular</SelectItem>
                    <SelectItem value="autorizado">Autorizado</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Titular nombre</Label>
                <Input value={form.titular_nombre} onChange={(e) => setForm((p) => ({ ...p, titular_nombre: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Titular DNI</Label>
                <Input value={form.titular_dni} onChange={(e) => setForm((p) => ({ ...p, titular_dni: e.target.value }))} />
              </div>
            </div>

            {/* Acceso club */}
            <p className="text-sm font-medium text-muted-foreground pt-2">Acceso al club</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="flex items-center gap-2">
                <Switch checked={form.permite_ingreso_club} onCheckedChange={(v) => setForm((p) => ({ ...p, permite_ingreso_club: v }))} />
                <Label className="text-sm">Permite ingreso al club</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Estacionamiento</Label>
                <Input value={form.lugar_estacionamiento_asignado} onChange={(e) => setForm((p) => ({ ...p, lugar_estacionamiento_asignado: e.target.value }))} placeholder="Ej: A-15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tag RFID</Label>
                <Input value={form.tag_rfid_estacionamiento} onChange={(e) => setForm((p) => ({ ...p, tag_rfid_estacionamiento: e.target.value }))} />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-sm text-muted-foreground">Notas</Label>
              <Textarea value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} rows={2} placeholder="Opcional" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={saveVehiculo} disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Lista de vehículos */}
        {vehiculos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehiculos.map((v) => (
              <Card key={v.id} className="relative">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {v.marca} {v.modelo}
                          {v.año && <span className="text-muted-foreground font-normal"> ({v.año})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{v.patente}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteVehiculo(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {getTipoLabel(v.tipo_vehiculo_slug) && <span>{getTipoLabel(v.tipo_vehiculo_slug)}</span>}
                    {v.color && <span>· {v.color}</span>}
                    {v.combustible && <span>· {v.combustible}</span>}
                    {getCompaniaLabel(v.seguro_compania_slug, v.seguro_compania_otra) && (
                      <span>· Seguro: {getCompaniaLabel(v.seguro_compania_slug, v.seguro_compania_otra)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <BadgeSeguro desde={v.seguro_vigencia_desde} hasta={v.seguro_vigencia_hasta} />
                    {v.permite_ingreso_club && (
                      <Badge variant="outline" className="border-info-500 text-info-600 dark:text-info-400">Ingreso club</Badge>
                    )}
                    {v.lugar_estacionamiento_asignado && (
                      <Badge variant="secondary" className="text-xs">Est: {v.lugar_estacionamiento_asignado}</Badge>
                    )}
                  </div>

                  {v.tipo_titularidad && v.tipo_titularidad !== 'titular' && (
                    <p className="text-xs text-muted-foreground">
                      {v.tipo_titularidad === 'autorizado' ? 'Autorizado' : 'Familiar'}{v.titular_nombre ? ` — ${v.titular_nombre}` : ''}
                    </p>
                  )}

                  {v.notas && (
                    <p className="text-xs text-muted-foreground italic">{v.notas}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">No hay vehículos registrados.</p>
          )
        )}
      </CardContent>
    </Card>
  )
}
