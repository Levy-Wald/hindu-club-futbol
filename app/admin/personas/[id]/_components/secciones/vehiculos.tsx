'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Car, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface Vehiculo {
  id: string
  marca: string
  modelo: string
  año: number | null
  patente: string | null
  color: string | null
  tipo_vehiculo: string | null
  compania_seguro: string | null
  numero_poliza: string | null
  vencimiento_seguro: string | null
  vencimiento_vtv: string | null
  activo: boolean
  notas: string | null
}

interface SeccionVehiculosProps {
  personaId: string
  tenantId: string
}

// --- Helpers ---

function getEstadoVencimiento(fecha: string | null): 'vigente' | 'por_vencer' | 'vencido' | 'sin_fecha' {
  if (!fecha) return 'sin_fecha'
  const hoy = new Date()
  const venc = new Date(fecha)
  if (venc < hoy) return 'vencido'
  const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'por_vencer'
  return 'vigente'
}

function BadgeVencimiento({ fecha, label }: { fecha: string | null; label: string }) {
  const estado = getEstadoVencimiento(fecha)
  switch (estado) {
    case 'vigente':
      return <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">{label}: Vigente</Badge>
    case 'por_vencer':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">{label}: Por vencer</Badge>
    case 'vencido':
      return <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">{label}: Vencido</Badge>
    default:
      return null
  }
}

const TIPOS_VEHICULO = [
  { value: 'auto', label: 'Auto' },
  { value: 'moto', label: 'Moto' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'otro', label: 'Otro' },
]

// --- Main Component ---

export function SeccionVehiculos({ personaId, tenantId }: SeccionVehiculosProps) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    año: '',
    patente: '',
    color: '',
    tipo_vehiculo: '',
    compania_seguro: '',
    numero_poliza: '',
    vencimiento_seguro: '',
    vencimiento_vtv: '',
    notas: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('personas_vehiculos')
        .select('*')
        .eq('persona_id', personaId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error(`Error cargando vehículos: ${error.message}`)
      } else if (data) {
        setVehiculos(data)
      }
      setLoaded(true)
    }
    load()
  }, [personaId])

  async function saveVehiculo() {
    if (!form.marca || !form.modelo) {
      toast.error('Marca y modelo son obligatorios')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('personas_vehiculos')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        marca: form.marca,
        modelo: form.modelo,
        año: form.año ? parseInt(form.año) : null,
        patente: form.patente || null,
        color: form.color || null,
        tipo_vehiculo: form.tipo_vehiculo || null,
        compania_seguro: form.compania_seguro || null,
        numero_poliza: form.numero_poliza || null,
        vencimiento_seguro: form.vencimiento_seguro || null,
        vencimiento_vtv: form.vencimiento_vtv || null,
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
      setForm({
        marca: '', modelo: '', año: '', patente: '', color: '',
        tipo_vehiculo: '', compania_seguro: '', numero_poliza: '',
        vencimiento_seguro: '', vencimiento_vtv: '', notas: '',
      })
      setShowForm(false)
      toast.success('Vehículo agregado')
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

  if (!loaded) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando vehículos...</CardContent></Card>
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
          <div className="rounded-md border p-4 space-y-3 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Marca *</Label>
                <Input value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} placeholder="Ej: Toyota" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Modelo *</Label>
                <Input value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} placeholder="Ej: Corolla" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Año</Label>
                <Input type="number" value={form.año} onChange={(e) => setForm((p) => ({ ...p, año: e.target.value }))} placeholder="Ej: 2022" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tipo</Label>
                <Select value={form.tipo_vehiculo} onValueChange={(v) => setForm((p) => ({ ...p, tipo_vehiculo: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_VEHICULO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Patente</Label>
                <Input value={form.patente} onChange={(e) => setForm((p) => ({ ...p, patente: e.target.value }))} placeholder="Ej: AB123CD" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Color</Label>
                <Input value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} placeholder="Ej: Blanco" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Compañía de seguro</Label>
                <Input value={form.compania_seguro} onChange={(e) => setForm((p) => ({ ...p, compania_seguro: e.target.value }))} placeholder="Ej: La Segunda" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">N° póliza</Label>
                <Input value={form.numero_poliza} onChange={(e) => setForm((p) => ({ ...p, numero_poliza: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Vencimiento seguro</Label>
                <Input type="date" value={form.vencimiento_seguro} onChange={(e) => setForm((p) => ({ ...p, vencimiento_seguro: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Vencimiento VTV</Label>
                <Input type="date" value={form.vencimiento_vtv} onChange={(e) => setForm((p) => ({ ...p, vencimiento_vtv: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Notas</Label>
              <Input value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Opcional" />
            </div>
            <div className="flex gap-2">
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
                        {v.patente && (
                          <p className="text-xs text-muted-foreground font-mono">{v.patente}</p>
                        )}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteVehiculo(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {v.tipo_vehiculo && (
                      <span className="capitalize">{TIPOS_VEHICULO.find((t) => t.value === v.tipo_vehiculo)?.label ?? v.tipo_vehiculo}</span>
                    )}
                    {v.color && <span>· {v.color}</span>}
                    {v.compania_seguro && <span>· {v.compania_seguro}</span>}
                    {v.numero_poliza && <span>· Póliza: {v.numero_poliza}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <BadgeVencimiento fecha={v.vencimiento_seguro} label="Seguro" />
                    <BadgeVencimiento fecha={v.vencimiento_vtv} label="VTV" />
                  </div>

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
