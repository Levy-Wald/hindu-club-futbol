'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Store, MapPin, ShoppingBag, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { crearConcesionario } from '../_actions'
import { PersonaSearchInput } from './persona-search-input'

interface ConcesionarioResumen {
  id: string
  nombre_comercial: string
  canon_porcentaje: number
  canon_minimo_mensual: number
  mp_modo: string
  activo: boolean
  titular: string | null
  tipo_titular: string
  cant_puntos_venta: number
  cant_productos: number
  ventas_mes_actual: number
  total_ventas_mes_actual: number
  canon_acumulado_mes_actual: number
}

export function ConcesionesListClient({ concesionarios }: { concesionarios: ConcesionarioResumen[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    persona_id: '',
    nombre_comercial: '',
    descripcion: '',
    canon_porcentaje: 0,
    canon_minimo_mensual: 0,
    fecha_inicio_acuerdo: new Date().toISOString().split('T')[0],
    notas: '',
  })

  function handleSubmit() {
    if (!formData.nombre_comercial.trim() || !formData.persona_id) {
      toast.error('Completá nombre comercial y persona responsable')
      return
    }
    startTransition(async () => {
      const res = await crearConcesionario(formData)
      if (res.ok) {
        toast.success(res.message ?? 'Concesionario creado')
        setOpen(false)
        setFormData({ persona_id: '', nombre_comercial: '', descripcion: '', canon_porcentaje: 0, canon_minimo_mensual: 0, fecha_inicio_acuerdo: new Date().toISOString().split('T')[0], notas: '' })
      } else {
        toast.error(res.message ?? 'Error al crear concesionario')
      }
    })
  }

  const activos = concesionarios.filter(c => c.activo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Concesiones</h1>
          <p className="text-muted-foreground text-sm">
            {activos.length} concesionario{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo concesionario
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo concesionario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titular (persona del sistema)</Label>
                <PersonaSearchInput
                  value={formData.persona_id}
                  onChange={(id) => setFormData(f => ({ ...f, persona_id: id }))}
                />
              </div>
              <div>
                <Label>Nombre comercial</Label>
                <Input
                  value={formData.nombre_comercial}
                  onChange={(e) => setFormData(f => ({ ...f, nombre_comercial: e.target.value }))}
                  placeholder="Kiosko del Vestuario"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Canon %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formData.canon_porcentaje}
                    onChange={(e) => setFormData(f => ({ ...f, canon_porcentaje: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Canon mínimo mensual</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.canon_minimo_mensual}
                    onChange={(e) => setFormData(f => ({ ...f, canon_minimo_mensual: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <Label>Fecha inicio acuerdo</Label>
                <Input
                  type="date"
                  value={formData.fecha_inicio_acuerdo}
                  onChange={(e) => setFormData(f => ({ ...f, fecha_inicio_acuerdo: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Input
                  value={formData.notas}
                  onChange={(e) => setFormData(f => ({ ...f, notas: e.target.value }))}
                />
              </div>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full">
                {isPending ? 'Creando...' : 'Crear concesionario'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tenés concesionarios cargados</p>
            <p className="text-sm">Creá uno para empezar a registrar ventas y calcular canon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activos.map((c) => (
            <Link key={c.id} href={`/admin/concesiones/${c.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    {c.nombre_comercial}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{c.titular ?? 'Sin titular'}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{c.cant_puntos_venta} PDV</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{c.cant_productos} productos</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ventas este mes</span>
                      <span className="font-medium">{c.ventas_mes_actual}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total vendido</span>
                      <span className="font-medium">${c.total_ventas_mes_actual.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Canon acum.
                      </span>
                      <span className="font-semibold text-primary">${c.canon_acumulado_mes_actual.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted">{c.canon_porcentaje}% canon</span>
                    <span className={`px-1.5 py-0.5 rounded ${c.mp_modo === 'mock' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      MP: {c.mp_modo}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
