'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Loader2,
  CalendarCheck,
  Send,
  DollarSign,
  Ban,
  ChevronDown,
  ChevronRight,
  FileText,
  Receipt,
  ListChecks,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SelectionBar } from '@/components/ui/selection-bar'
import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import type { ExportData } from '@/lib/export/formats'
import {
  crearPlan,
  editarPlan,
  crearBonificacion,
  editarBonificacion,
  emitirCuotasMasivas,
  cobrarCuota,
  anularCuota,
  contarPersonasEmision,
} from '../_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Plan {
  id: string
  nombre: string
  descripcion: string | null
  periodicidad: string
  monto: number
  moneda: string
  dia_vencimiento: number
  mora_porcentaje: number
  activo: boolean
  created_at: string
}

interface Bonificacion {
  id: string
  plan_id: string
  nombre: string
  tipo: string
  valor: number
  condicion: string | null
  activo: boolean
}

interface CuotaEmitida {
  id: string
  plan_id: string
  persona_id: string
  periodo: string
  monto_original: number
  monto_final: number
  moneda: string
  fecha_vencimiento: string
  estado: string
  fecha_pago: string | null
  movimiento_id: string | null
  bonificaciones_aplicadas: Array<{ nombre: string; descuento: number }> | null
  personas?: { nombre: string; apellido: string } | null
  cuotas_planes?: { nombre: string } | null
}

interface Emision {
  id: string
  plan_id: string
  padron_id: string | null
  periodo: string
  cantidad: number
  monto_unitario: number
  created_at: string
  cuotas_planes?: { nombre: string } | null
  padrones?: { nombre: string } | null
}

interface Padron {
  id: string
  nombre: string
}

interface Caja {
  id: string
  nombre: string
}

interface MedioPago {
  id: string
  nombre: string
}

interface PlanForm {
  nombre: string
  descripcion: string
  periodicidad: string
  monto: string
  moneda: string
  dia_vencimiento: string
  mora_porcentaje: string
  activo: boolean
}

interface BonificacionForm {
  plan_id: string
  nombre: string
  tipo: string
  valor: string
  condicion: string
  activo: boolean
}

const EMPTY_PLAN_FORM: PlanForm = {
  nombre: '',
  descripcion: '',
  periodicidad: 'mensual',
  monto: '',
  moneda: 'ARS',
  dia_vencimiento: '10',
  mora_porcentaje: '0',
  activo: true,
}

const EMPTY_BONIF_FORM: BonificacionForm = {
  plan_id: '',
  nombre: '',
  tipo: 'porcentaje',
  valor: '',
  condicion: '',
  activo: true,
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

const PERIODICIDADES = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
] as const

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'vencida':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'pagada':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'anulada':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return ''
  }
}

function estadoLabel(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'Pendiente'
    case 'vencida': return 'Vencida'
    case 'pagada': return 'Pagada'
    case 'anulada': return 'Anulada'
    default: return estado
  }
}

function getCurrentPeriodo(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function CuotasClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Cuotas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de planes de cuotas, emisiones y cobros
        </p>
      </div>

      <Tabs defaultValue="planes" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="planes">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Planes</span>
          </TabsTrigger>
          <TabsTrigger value="emisiones">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Emisiones</span>
          </TabsTrigger>
          <TabsTrigger value="estado">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Estado de cuotas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planes">
          <PlanesTab />
        </TabsContent>

        <TabsContent value="emisiones">
          <EmisionesTab />
        </TabsContent>

        <TabsContent value="estado">
          <EstadoCuotasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// -------------------------------------------------------------------
// Tab 1: Planes
// -------------------------------------------------------------------

function PlanesTab() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [bonificaciones, setBonificaciones] = useState<Bonificacion[]>([])
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState<PlanForm>(EMPTY_PLAN_FORM)
  const [bonifDialogOpen, setBonifDialogOpen] = useState(false)
  const [editingBonifId, setEditingBonifId] = useState<string | null>(null)
  const [bonifForm, setBonifForm] = useState<BonificacionForm>(EMPTY_BONIF_FORM)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [searchPlanes, setSearchPlanes] = useState('')
  const [selectedPlanes, setSelectedPlanes] = useState<Set<string>>(new Set())

  async function fetchData() {
    const supabase = createClient()

    const [planesRes, bonifRes] = await Promise.all([
      supabase
        .from('cuotas_planes')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('nombre'),
      supabase
        .from('cuotas_bonificaciones')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('nombre'),
    ])

    if (planesRes.data) setPlanes(planesRes.data as Plan[])
    if (bonifRes.data) setBonificaciones(bonifRes.data as Bonificacion[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  function openCreatePlan() {
    setEditingPlanId(null)
    setPlanForm(EMPTY_PLAN_FORM)
    setPlanDialogOpen(true)
  }

  function openEditPlan(plan: Plan) {
    setEditingPlanId(plan.id)
    setPlanForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      periodicidad: plan.periodicidad,
      monto: String(plan.monto),
      moneda: plan.moneda || 'ARS',
      dia_vencimiento: String(plan.dia_vencimiento),
      mora_porcentaje: String(plan.mora_porcentaje),
      activo: plan.activo,
    })
    setPlanDialogOpen(true)
  }

  function openCreateBonif(planId: string) {
    setEditingBonifId(null)
    setBonifForm({ ...EMPTY_BONIF_FORM, plan_id: planId })
    setBonifDialogOpen(true)
  }

  function openEditBonif(bonif: Bonificacion) {
    setEditingBonifId(bonif.id)
    setBonifForm({
      plan_id: bonif.plan_id,
      nombre: bonif.nombre,
      tipo: bonif.tipo,
      valor: String(bonif.valor),
      condicion: bonif.condicion || '',
      activo: bonif.activo,
    })
    setBonifDialogOpen(true)
  }

  function handleSubmitPlan() {
    const input = {
      nombre: planForm.nombre,
      descripcion: planForm.descripcion || null,
      periodicidad: planForm.periodicidad,
      monto: parseFloat(planForm.monto) || 0,
      moneda: planForm.moneda,
      dia_vencimiento: parseInt(planForm.dia_vencimiento) || 10,
      mora_porcentaje: parseFloat(planForm.mora_porcentaje) || 0,
      activo: planForm.activo,
    }

    startTransition(async () => {
      const result = editingPlanId
        ? await editarPlan(editingPlanId, input)
        : await crearPlan(input)

      if (result.ok) {
        toast.success(result.message)
        setPlanDialogOpen(false)
        setPlanForm(EMPTY_PLAN_FORM)
        setEditingPlanId(null)
        fetchData()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleSubmitBonif() {
    const input = {
      plan_id: bonifForm.plan_id,
      nombre: bonifForm.nombre,
      tipo: bonifForm.tipo,
      valor: parseFloat(bonifForm.valor) || 0,
      condicion: bonifForm.condicion || null,
      activo: bonifForm.activo,
    }

    startTransition(async () => {
      const result = editingBonifId
        ? await editarBonificacion(editingBonifId, input)
        : await crearBonificacion(input)

      if (result.ok) {
        toast.success(result.message)
        setBonifDialogOpen(false)
        setBonifForm(EMPTY_BONIF_FORM)
        setEditingBonifId(null)
        fetchData()
      } else {
        toast.error(result.message)
      }
    })
  }

  const filteredPlanes = planes.filter((plan) => {
    if (!searchPlanes) return true
    const q = searchPlanes.toLowerCase()
    return (
      plan.nombre.toLowerCase().includes(q) ||
      (plan.descripcion ?? '').toLowerCase().includes(q)
    )
  })

  function toggleSelectPlan(planId: string) {
    setSelectedPlanes((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) {
        next.delete(planId)
      } else {
        next.add(planId)
      }
      return next
    })
  }

  function getPlanesExportData(): ExportData | null {
    const source = selectedPlanes.size > 0
      ? filteredPlanes.filter((p) => selectedPlanes.has(p.id))
      : filteredPlanes
    if (source.length === 0) return null
    return {
      headers: ['Nombre', 'Descripcion', 'Periodicidad', 'Monto', 'Moneda', 'Dia vencimiento', 'Mora %', 'Activo'],
      rows: source.map((p) => [
        p.nombre,
        p.descripcion ?? '',
        PERIODICIDADES.find((per) => per.value === p.periodicidad)?.label ?? p.periodicidad,
        String(p.monto),
        p.moneda,
        String(p.dia_vencimiento),
        String(p.mora_porcentaje),
        p.activo ? 'Si' : 'No',
      ]),
      filename: 'planes-cuotas',
    }
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planes..."
            value={searchPlanes}
            onChange={(e) => setSearchPlanes(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DownloadTemplateButton
            headers={['nombre', 'periodicidad', 'monto', 'moneda', 'dia_vencimiento', 'mora_porcentaje']}
            filename="modelo_cuotas_planes"
            sampleRow={['Cuota social', 'mensual', '25000', 'ARS', '10', '5']}
          />
          <ExportFormatSelector getData={getPlanesExportData} />
          <Button onClick={openCreatePlan} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo plan
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredPlanes.length} plan(es) configurado(s)</p>

      {filteredPlanes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay planes de cuotas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer plan para empezar a emitir cuotas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlanes.map((plan) => {
            const planBonifs = bonificaciones.filter((b) => b.plan_id === plan.id)
            const expanded = expandedPlanId === plan.id

            return (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedPlanes.has(plan.id)}
                        onCheckedChange={() => toggleSelectPlan(plan.id)}
                        className="mt-1"
                      />
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setExpandedPlanId(expanded ? null : plan.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {expanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="font-medium">{plan.nombre}</p>
                        <Badge variant={plan.activo ? 'default' : 'secondary'}>
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground ml-8">
                        <span>
                          {PERIODICIDADES.find((p) => p.value === plan.periodicidad)?.label ?? plan.periodicidad}
                        </span>
                        <span className="font-mono">{formatMoney(plan.monto, plan.moneda)}</span>
                        <span>Vence dia {plan.dia_vencimiento}</span>
                        {plan.mora_porcentaje > 0 && <span>Mora: {plan.mora_porcentaje}%</span>}
                        {planBonifs.length > 0 && (
                          <span>{planBonifs.length} bonificacion(es)</span>
                        )}
                      </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" disabled={isPending} />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCreateBonif(plan.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar bonificacion
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Bonificaciones expandidas */}
                  {expanded && (
                    <div className="mt-4 ml-8 space-y-2">
                      {plan.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">{plan.descripcion}</p>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Bonificaciones</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreateBonif(plan.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {planBonifs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sin bonificaciones configuradas.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {planBonifs.map((bonif) => (
                            <div
                              key={bonif.id}
                              className="flex items-center justify-between rounded-lg border p-3 text-sm"
                            >
                              <div>
                                <p className="font-medium">{bonif.nombre}</p>
                                <p className="text-muted-foreground">
                                  {bonif.tipo === 'porcentaje'
                                    ? `${bonif.valor}% de descuento`
                                    : `${formatMoney(bonif.valor)} de descuento`}
                                  {bonif.condicion && ` - ${bonif.condicion}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={bonif.activo ? 'default' : 'secondary'}>
                                  {bonif.activo ? 'Activa' : 'Inactiva'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openEditBonif(bonif)}
                                  disabled={isPending}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SelectionBar
        count={selectedPlanes.size}
        total={filteredPlanes.length}
        onSelectAll={() => setSelectedPlanes(new Set(filteredPlanes.map((p) => p.id)))}
        onClear={() => setSelectedPlanes(new Set())}
        getData={getPlanesExportData}
      />

      {/* Dialog Plan */}
      <Dialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPlanDialogOpen(false)
            setEditingPlanId(null)
            setPlanForm(EMPTY_PLAN_FORM)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlanId ? 'Editar plan' : 'Nuevo plan de cuotas'}</DialogTitle>
            <DialogDescription>
              {editingPlanId
                ? 'Modifica los datos del plan.'
                : 'Configura un nuevo plan de cuotas para el club.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-nombre">Nombre *</Label>
              <Input
                id="plan-nombre"
                placeholder="Ej: Cuota social"
                value={planForm.nombre}
                onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Periodicidad</Label>
              <Select
                value={planForm.periodicidad}
                onValueChange={(val) => setPlanForm({ ...planForm, periodicidad: val ?? 'mensual' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="plan-monto">Monto *</Label>
                <Input
                  id="plan-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={planForm.monto}
                  onChange={(e) => setPlanForm({ ...planForm, monto: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={planForm.moneda}
                  onValueChange={(val) => setPlanForm({ ...planForm, moneda: val ?? 'ARS' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-dia-venc">Dia de vencimiento (1-28)</Label>
                <Input
                  id="plan-dia-venc"
                  type="number"
                  min="1"
                  max="28"
                  value={planForm.dia_vencimiento}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, dia_vencimiento: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-mora">Mora %</Label>
                <Input
                  id="plan-mora"
                  type="number"
                  step="0.1"
                  min="0"
                  value={planForm.mora_porcentaje}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, mora_porcentaje: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-desc">Descripcion</Label>
              <Input
                id="plan-desc"
                placeholder="Descripcion opcional del plan"
                value={planForm.descripcion}
                onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Activo</p>
                <p className="text-xs text-muted-foreground">
                  Solo los planes activos se pueden emitir
                </p>
              </div>
              <Switch
                checked={planForm.activo}
                onCheckedChange={(checked) =>
                  setPlanForm({ ...planForm, activo: Boolean(checked) })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPlanDialogOpen(false)
                setEditingPlanId(null)
                setPlanForm(EMPTY_PLAN_FORM)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitPlan} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingPlanId ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bonificacion */}
      <Dialog
        open={bonifDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBonifDialogOpen(false)
            setEditingBonifId(null)
            setBonifForm(EMPTY_BONIF_FORM)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBonifId ? 'Editar bonificacion' : 'Nueva bonificacion'}
            </DialogTitle>
            <DialogDescription>
              Las bonificaciones se aplican automaticamente al emitir cuotas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bonif-nombre">Nombre *</Label>
              <Input
                id="bonif-nombre"
                placeholder="Ej: Grupo familiar, Pago anticipado"
                value={bonifForm.nombre}
                onChange={(e) => setBonifForm({ ...bonifForm, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de descuento</Label>
              <Select
                value={bonifForm.tipo}
                onValueChange={(val) => setBonifForm({ ...bonifForm, tipo: val ?? 'porcentaje' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto_fijo">Monto fijo ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonif-valor">
                Valor {bonifForm.tipo === 'porcentaje' ? '(%)' : '($)'}
              </Label>
              <Input
                id="bonif-valor"
                type="number"
                step={bonifForm.tipo === 'porcentaje' ? '1' : '0.01'}
                min="0"
                placeholder="0"
                value={bonifForm.valor}
                onChange={(e) => setBonifForm({ ...bonifForm, valor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonif-condicion">Condicion (opcional)</Label>
              <Input
                id="bonif-condicion"
                placeholder="Ej: Socios con mas de 5 anios"
                value={bonifForm.condicion}
                onChange={(e) => setBonifForm({ ...bonifForm, condicion: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Activa</p>
                <p className="text-xs text-muted-foreground">
                  Solo las bonificaciones activas se aplican
                </p>
              </div>
              <Switch
                checked={bonifForm.activo}
                onCheckedChange={(checked) =>
                  setBonifForm({ ...bonifForm, activo: Boolean(checked) })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBonifDialogOpen(false)
                setEditingBonifId(null)
                setBonifForm(EMPTY_BONIF_FORM)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitBonif} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingBonifId ? 'Guardar cambios' : 'Crear bonificacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -------------------------------------------------------------------
// Tab 2: Emisiones
// -------------------------------------------------------------------

function EmisionesTab() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [padrones, setPadrones] = useState<Padron[]>([])
  const [emisiones, setEmisiones] = useState<Emision[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedPadronId, setSelectedPadronId] = useState('todos')
  const [periodo, setPeriodo] = useState(getCurrentPeriodo())
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [conteo, setConteo] = useState<{
    total_personas: number
    ya_emitidas: number
    nuevas: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [searchEmisiones, setSearchEmisiones] = useState('')
  const [selectedEmisiones, setSelectedEmisiones] = useState<Set<string>>(new Set())

  async function fetchData() {
    const supabase = createClient()

    const [planesRes, padronesRes, emisionesRes] = await Promise.all([
      supabase
        .from('cuotas_planes')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('activo', true)
        .order('nombre'),
      supabase
        .from('padrones')
        .select('id, nombre')
        .eq('tenant_id', TENANT_ID)
        .order('nombre'),
      supabase
        .from('emisiones_cuota')
        .select('*, cuotas_planes(nombre), padrones(nombre)')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (planesRes.data) setPlanes(planesRes.data as Plan[])
    if (padronesRes.data) setPadrones(padronesRes.data as Padron[])
    if (emisionesRes.data) setEmisiones(emisionesRes.data as Emision[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handlePreEmitir() {
    if (!selectedPlanId) {
      toast.error('Selecciona un plan')
      return
    }

    if (!periodo) {
      toast.error('Selecciona un periodo')
      return
    }

    startTransition(async () => {
      const result = await contarPersonasEmision(
        selectedPlanId,
        selectedPadronId === 'todos' ? null : selectedPadronId,
        periodo
      )

      if (result.ok) {
        const data = result.data as {
          total_personas: number
          ya_emitidas: number
          nuevas: number
        }
        setConteo(data)
        setConfirmDialogOpen(true)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleEmitir() {
    startTransition(async () => {
      const result = await emitirCuotasMasivas(
        selectedPlanId,
        selectedPadronId === 'todos' ? null : selectedPadronId,
        periodo
      )

      if (result.ok) {
        toast.success(result.message)
        setConfirmDialogOpen(false)
        setConteo(null)
        fetchData()
      } else {
        toast.error(result.message)
      }
    })
  }

  const filteredEmisiones = emisiones.filter((emision) => {
    if (!searchEmisiones) return true
    const q = searchEmisiones.toLowerCase()
    return (
      (emision.cuotas_planes?.nombre ?? '').toLowerCase().includes(q) ||
      (emision.padrones?.nombre ?? '').toLowerCase().includes(q) ||
      emision.periodo.toLowerCase().includes(q)
    )
  })

  function toggleSelectEmision(emisionId: string) {
    setSelectedEmisiones((prev) => {
      const next = new Set(prev)
      if (next.has(emisionId)) {
        next.delete(emisionId)
      } else {
        next.add(emisionId)
      }
      return next
    })
  }

  function getEmisionesExportData(): ExportData | null {
    const source = selectedEmisiones.size > 0
      ? filteredEmisiones.filter((e) => selectedEmisiones.has(e.id))
      : filteredEmisiones
    if (source.length === 0) return null
    return {
      headers: ['Plan', 'Padron', 'Periodo', 'Cantidad', 'Monto unitario', 'Fecha'],
      rows: source.map((e) => [
        e.cuotas_planes?.nombre ?? '-',
        e.padrones?.nombre ?? 'Todos',
        e.periodo,
        String(e.cantidad),
        formatMoney(e.monto_unitario),
        formatFecha(e.created_at),
      ]),
      filename: 'emisiones-cuotas',
    }
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Formulario de emision */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emitir cuotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select value={selectedPlanId} onValueChange={(val) => setSelectedPlanId(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {planes.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nombre} ({formatMoney(plan.monto, plan.moneda)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Padron</Label>
              <Select value={selectedPadronId} onValueChange={(val) => setSelectedPadronId(val ?? 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los activos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los activos</SelectItem>
                  {padrones.map((padron) => (
                    <SelectItem key={padron.id} value={padron.id}>
                      {padron.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emision-periodo">Periodo (YYYY-MM)</Label>
              <Input
                id="emision-periodo"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePreEmitir} disabled={isPending || !selectedPlanId}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <Send className="h-4 w-4 mr-1" />
              Emitir cuotas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de emisiones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Historial de emisiones</CardTitle>
            <ExportFormatSelector getData={getEmisionesExportData} />
          </div>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emisiones..."
              value={searchEmisiones}
              onChange={(e) => setSearchEmisiones(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEmisiones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No hay emisiones registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredEmisiones.length > 0 &&
                        selectedEmisiones.size === filteredEmisiones.length
                      }
                      onCheckedChange={() => {
                        if (selectedEmisiones.size === filteredEmisiones.length) {
                          setSelectedEmisiones(new Set())
                        } else {
                          setSelectedEmisiones(new Set(filteredEmisiones.map((e) => e.id)))
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Padron</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Monto unitario</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmisiones.map((emision) => (
                  <TableRow key={emision.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmisiones.has(emision.id)}
                        onCheckedChange={() => toggleSelectEmision(emision.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {emision.cuotas_planes?.nombre ?? '-'}
                    </TableCell>
                    <TableCell>{emision.padrones?.nombre ?? 'Todos'}</TableCell>
                    <TableCell>{emision.periodo}</TableCell>
                    <TableCell className="text-right">{emision.cantidad}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMoney(emision.monto_unitario)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFecha(emision.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SelectionBar
        count={selectedEmisiones.size}
        total={filteredEmisiones.length}
        onSelectAll={() => setSelectedEmisiones(new Set(filteredEmisiones.map((e) => e.id)))}
        onClear={() => setSelectedEmisiones(new Set())}
        getData={getEmisionesExportData}
      />

      {/* Dialog confirmacion emision */}
      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogOpen(false)
            setConteo(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar emision de cuotas</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de emitir las cuotas.
            </DialogDescription>
          </DialogHeader>

          {conteo && (
            <div className="space-y-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">
                    {planes.find((p) => p.id === selectedPlanId)?.nombre ?? '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Padron:</span>
                  <span className="font-medium">
                    {selectedPadronId === 'todos'
                      ? 'Todos los activos'
                      : padrones.find((p) => p.id === selectedPadronId)?.nombre ?? '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periodo:</span>
                  <span className="font-medium">{periodo}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total personas:</span>
                  <span className="font-medium">{conteo.total_personas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ya emitidas:</span>
                  <span className="font-medium">{conteo.ya_emitidas}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Cuotas nuevas a emitir:</span>
                  <span className="font-bold text-lg">{conteo.nuevas}</span>
                </div>
              </div>

              {conteo.nuevas === 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No hay cuotas nuevas para emitir en este periodo.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false)
                setConteo(null)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEmitir}
              disabled={isPending || (conteo?.nuevas ?? 0) === 0}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <Send className="h-4 w-4 mr-1" />
              Emitir {conteo?.nuevas ?? 0} cuotas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -------------------------------------------------------------------
// Tab 3: Estado de cuotas
// -------------------------------------------------------------------

function EstadoCuotasTab() {
  const [cuotas, setCuotas] = useState<CuotaEmitida[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [cajas, setCajas] = useState<Caja[]>([])
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([])
  const [filtroPlan, setFiltroPlan] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState(getCurrentPeriodo())
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [selectedCuotas, setSelectedCuotas] = useState<Set<string>>(new Set())
  const [cobrarDialog, setCobrarDialog] = useState<CuotaEmitida | null>(null)
  const [cobrarCajaId, setCobrarCajaId] = useState('')
  const [cobrarMedioPagoId, setCobrarMedioPagoId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [searchCuotas, setSearchCuotas] = useState('')

  async function fetchData() {
    const supabase = createClient()

    const [planesRes, cajasRes, mediosRes] = await Promise.all([
      supabase
        .from('cuotas_planes')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('nombre'),
      supabase
        .from('cajas')
        .select('id, nombre')
        .eq('tenant_id', TENANT_ID)
        .eq('activa', true)
        .order('nombre'),
      supabase
        .from('medios_pago')
        .select('id, nombre')
        .eq('tenant_id', TENANT_ID)
        .eq('activo', true)
        .order('nombre'),
    ])

    if (planesRes.data) setPlanes(planesRes.data as Plan[])
    if (cajasRes.data) setCajas(cajasRes.data as Caja[])
    if (mediosRes.data) setMediosPago(mediosRes.data as MedioPago[])

    setLoading(false)
  }

  async function fetchCuotas() {
    const supabase = createClient()

    let query = supabase
      .from('cuotas_emitidas')
      .select('*, personas(nombre, apellido), cuotas_planes(nombre)')
      .eq('tenant_id', TENANT_ID)
      .order('fecha_vencimiento', { ascending: true })
      .limit(200)

    if (filtroPlan !== 'todos') {
      query = query.eq('plan_id', filtroPlan)
    }

    if (filtroPeriodo) {
      query = query.eq('periodo', filtroPeriodo)
    }

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data } = await query

    if (data) setCuotas(data as CuotaEmitida[])
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchCuotas()
    }
  }, [filtroPlan, filtroPeriodo, filtroEstado, loading])

  function toggleSelect(cuotaId: string) {
    setSelectedCuotas((prev) => {
      const next = new Set(prev)
      if (next.has(cuotaId)) {
        next.delete(cuotaId)
      } else {
        next.add(cuotaId)
      }
      return next
    })
  }

  function toggleSelectAll() {
    const cobrablesAll = filteredCuotas.filter(
      (c) => c.estado === 'pendiente' || c.estado === 'vencida'
    )
    if (selectedCuotas.size === cobrablesAll.length) {
      setSelectedCuotas(new Set())
    } else {
      setSelectedCuotas(new Set(cobrablesAll.map((c) => c.id)))
    }
  }

  function handleCobrar(cuota: CuotaEmitida) {
    setCobrarDialog(cuota)
    setCobrarCajaId('')
    setCobrarMedioPagoId('')
  }

  function handleConfirmCobrar() {
    if (!cobrarDialog) return

    if (!cobrarCajaId) {
      toast.error('Selecciona una caja')
      return
    }

    if (!cobrarMedioPagoId) {
      toast.error('Selecciona un medio de pago')
      return
    }

    startTransition(async () => {
      const result = await cobrarCuota(cobrarDialog.id, cobrarCajaId, cobrarMedioPagoId)
      if (result.ok) {
        toast.success(result.message)
        setCobrarDialog(null)
        setSelectedCuotas((prev) => {
          const next = new Set(prev)
          next.delete(cobrarDialog.id)
          return next
        })
        fetchCuotas()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleCobrarSeleccionadas() {
    if (selectedCuotas.size === 0) {
      toast.error('Selecciona al menos una cuota')
      return
    }

    // Para cobro masivo, usamos la primera cuota seleccionada como referencia
    const primeraCuota = cuotas.find((c) => selectedCuotas.has(c.id))
    if (primeraCuota) {
      handleCobrar(primeraCuota)
    }
  }

  function handleAnular(cuotaId: string) {
    startTransition(async () => {
      const result = await anularCuota(cuotaId)
      if (result.ok) {
        toast.success(result.message)
        fetchCuotas()
      } else {
        toast.error(result.message)
      }
    })
  }

  const filteredCuotas = cuotas.filter((cuota) => {
    if (!searchCuotas) return true
    const q = searchCuotas.toLowerCase()
    const personaNombre = cuota.personas
      ? `${cuota.personas.apellido} ${cuota.personas.nombre}`.toLowerCase()
      : ''
    return (
      personaNombre.includes(q) ||
      (cuota.cuotas_planes?.nombre ?? '').toLowerCase().includes(q) ||
      cuota.periodo.toLowerCase().includes(q)
    )
  })

  function getCuotasExportData(): ExportData | null {
    const source = selectedCuotas.size > 0
      ? filteredCuotas.filter((c) => selectedCuotas.has(c.id))
      : filteredCuotas
    if (source.length === 0) return null
    return {
      headers: ['Persona', 'Plan', 'Periodo', 'Monto original', 'Monto final', 'Estado', 'Vencimiento', 'Fecha pago'],
      rows: source.map((c) => [
        c.personas ? `${c.personas.apellido}, ${c.personas.nombre}` : '-',
        c.cuotas_planes?.nombre ?? '-',
        c.periodo,
        formatMoney(c.monto_original, c.moneda),
        formatMoney(c.monto_final, c.moneda),
        estadoLabel(c.estado),
        formatFecha(c.fecha_vencimiento),
        c.fecha_pago ? formatFecha(c.fecha_pago) : '-',
      ]),
      filename: 'estado-cuotas',
    }
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const cobrables = filteredCuotas.filter(
    (c) => c.estado === 'pendiente' || c.estado === 'vencida'
  )

  return (
    <div className="space-y-4 mt-4">
      {/* Busqueda y exportacion */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por persona, plan..."
            value={searchCuotas}
            onChange={(e) => setSearchCuotas(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DownloadTemplateButton
            headers={['persona_documento', 'plan_nombre', 'periodo', 'monto']}
            filename="modelo_cuotas_emitidas"
            sampleRow={['12345678', 'Cuota social', '2026-06', '25000']}
          />
          <ExportFormatSelector getData={getCuotasExportData} />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={filtroPlan} onValueChange={(val) => setFiltroPlan(val ?? 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los planes</SelectItem>
                  {planes.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-periodo">Periodo</Label>
              <Input
                id="filtro-periodo"
                type="month"
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val ?? 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="anulada">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones masivas */}
      {selectedCuotas.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <Button size="sm" onClick={handleCobrarSeleccionadas}>
            <DollarSign className="h-4 w-4 mr-1" />
            Cobrar seleccionadas ({selectedCuotas.size})
          </Button>
        </div>
      )}

      {/* Tabla de cuotas */}
      {filteredCuotas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay cuotas</p>
            <p className="text-sm text-muted-foreground mt-1">
              No se encontraron cuotas con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-x-auto">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          cobrables.length > 0 && selectedCuotas.size === cobrables.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Monto original</TableHead>
                    <TableHead className="text-right">Bonificaciones</TableHead>
                    <TableHead className="text-right">Monto final</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Fecha pago</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuotas.map((cuota) => {
                    const esCobrable =
                      cuota.estado === 'pendiente' || cuota.estado === 'vencida'
                    const totalBonif = cuota.monto_original - cuota.monto_final

                    return (
                      <TableRow key={cuota.id}>
                        <TableCell>
                          {esCobrable && (
                            <Checkbox
                              checked={selectedCuotas.has(cuota.id)}
                              onCheckedChange={() => toggleSelect(cuota.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {cuota.personas
                            ? `${cuota.personas.apellido}, ${cuota.personas.nombre}`
                            : '-'}
                        </TableCell>
                        <TableCell>{cuota.cuotas_planes?.nombre ?? '-'}</TableCell>
                        <TableCell>{cuota.periodo}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatMoney(cuota.monto_original, cuota.moneda)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {totalBonif > 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              -{formatMoney(totalBonif, cuota.moneda)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatMoney(cuota.monto_final, cuota.moneda)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={estadoBadgeClass(cuota.estado)}
                          >
                            {estadoLabel(cuota.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFecha(cuota.fecha_vencimiento)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cuota.fecha_pago ? formatFecha(cuota.fecha_pago) : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isPending}
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {esCobrable && (
                                <DropdownMenuItem onClick={() => handleCobrar(cuota)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Cobrar
                                </DropdownMenuItem>
                              )}
                              {esCobrable && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleAnular(cuota.id)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Anular
                                  </DropdownMenuItem>
                                </>
                              )}
                              {cuota.estado === 'pagada' && (
                                <DropdownMenuItem disabled>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Ya cobrada
                                </DropdownMenuItem>
                              )}
                              {cuota.estado === 'anulada' && (
                                <DropdownMenuItem disabled>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Anulada
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredCuotas.map((cuota) => {
              const esCobrable =
                cuota.estado === 'pendiente' || cuota.estado === 'vencida'
              const totalBonif = cuota.monto_original - cuota.monto_final

              return (
                <Card key={cuota.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {esCobrable && (
                            <Checkbox
                              checked={selectedCuotas.has(cuota.id)}
                              onCheckedChange={() => toggleSelect(cuota.id)}
                            />
                          )}
                          <p className="font-medium text-sm">
                            {cuota.personas
                              ? `${cuota.personas.apellido}, ${cuota.personas.nombre}`
                              : '-'}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${estadoBadgeClass(cuota.estado)}`}
                          >
                            {estadoLabel(cuota.estado)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{cuota.cuotas_planes?.nombre ?? '-'}</span>
                          <span>{cuota.periodo}</span>
                          <span className="font-mono">
                            {formatMoney(cuota.monto_final, cuota.moneda)}
                          </span>
                          {totalBonif > 0 && (
                            <span className="text-green-600 dark:text-green-400">
                              (Bonif: -{formatMoney(totalBonif, cuota.moneda)})
                            </span>
                          )}
                          <span>Vence: {formatFecha(cuota.fecha_vencimiento)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {esCobrable && (
                            <DropdownMenuItem onClick={() => handleCobrar(cuota)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Cobrar
                            </DropdownMenuItem>
                          )}
                          {esCobrable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleAnular(cuota.id)}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Anular
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <SelectionBar
        count={selectedCuotas.size}
        total={filteredCuotas.length}
        onSelectAll={() => setSelectedCuotas(new Set(cobrables.map((c) => c.id)))}
        onClear={() => setSelectedCuotas(new Set())}
        getData={getCuotasExportData}
      />

      {/* Dialog Cobrar */}
      <Dialog
        open={!!cobrarDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCobrarDialog(null)
            setCobrarCajaId('')
            setCobrarMedioPagoId('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar cuota</DialogTitle>
            <DialogDescription>
              Selecciona la caja y el medio de pago para registrar el cobro.
            </DialogDescription>
          </DialogHeader>

          {cobrarDialog && (
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona:</span>
                <span className="font-medium">
                  {cobrarDialog.personas
                    ? `${cobrarDialog.personas.apellido}, ${cobrarDialog.personas.nombre}`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">
                  {cobrarDialog.cuotas_planes?.nombre ?? '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodo:</span>
                <span className="font-medium">{cobrarDialog.periodo}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Monto a cobrar:</span>
                <span className="font-bold text-lg">
                  {formatMoney(cobrarDialog.monto_final, cobrarDialog.moneda)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Caja *</Label>
              <Select value={cobrarCajaId} onValueChange={(val) => setCobrarCajaId(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((caja) => (
                    <SelectItem key={caja.id} value={caja.id}>
                      {caja.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Medio de pago *</Label>
              <Select value={cobrarMedioPagoId} onValueChange={(val) => setCobrarMedioPagoId(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  {mediosPago.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCobrarDialog(null)
                setCobrarCajaId('')
                setCobrarMedioPagoId('')
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmCobrar} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <DollarSign className="h-4 w-4 mr-1" />
              Cobrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
