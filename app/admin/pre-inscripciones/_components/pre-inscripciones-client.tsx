'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  MoreHorizontal,
  Check,
  X,
  Clock,
  Eye,
  UserPlus,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import {
  aprobarPreInscripcion,
  rechazarPreInscripcion,
  marcarEnRevision,
} from '../_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface PreInscripcion {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  tipo_documento: string | null
  fecha_nacimiento: string | null
  sexo: string | null
  email: string | null
  telefono: string | null
  disciplina_interes: string | null
  posicion_interes: string | null
  experiencia: string | null
  mensaje: string | null
  es_menor: boolean
  tutor_nombre: string | null
  tutor_apellido: string | null
  tutor_email: string | null
  tutor_telefono: string | null
  tutor_relacion: string | null
  estado: string
  motivo_rechazo: string | null
  persona_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

interface Stats {
  total: number
  pendiente: number
  en_revision: number
  aprobada: number
  rechazada: number
}

interface PreInscripcionesClientProps {
  inscripciones: PreInscripcion[]
  stats: Stats
  filtroActual: string
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '-'
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return `${edad}`
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function estadoBadgeVariant(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'aprobada':
      return 'default'
    case 'rechazada':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
    case 'en_revision':
      return 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400'
    case 'aprobada':
      return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
    case 'rechazada':
      return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
    default:
      return ''
  }
}

function estadoLabel(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'Pendiente'
    case 'en_revision': return 'En revision'
    case 'aprobada': return 'Aprobada'
    case 'rechazada': return 'Rechazada'
    default: return estado
  }
}

// -------------------------------------------------------------------
// Stats cards
// -------------------------------------------------------------------

const FILTROS = [
  { key: 'todas', label: 'Todas', icon: FileText },
  { key: 'pendiente', label: 'Pendientes', icon: Clock },
  { key: 'en_revision', label: 'En revision', icon: Search },
  { key: 'aprobada', label: 'Aprobadas', icon: Check },
  { key: 'rechazada', label: 'Rechazadas', icon: X },
] as const

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function PreInscripcionesClient({
  inscripciones,
  stats,
  filtroActual,
}: PreInscripcionesClientProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aprobarDialog, setAprobarDialog] = useState<PreInscripcion | null>(null)
  const [rechazarDialog, setRechazarDialog] = useState<PreInscripcion | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleFiltro(key: string) {
    const params = new URLSearchParams()
    if (key !== 'todas') params.set('filtro', key)
    router.push(`/admin/pre-inscripciones${params.toString() ? `?${params}` : ''}`)
  }

  function handleAprobar() {
    if (!aprobarDialog) return
    startTransition(async () => {
      const result = await aprobarPreInscripcion(aprobarDialog.id)
      if (result.ok) {
        toast.success(result.message)
        setAprobarDialog(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleRechazar() {
    if (!rechazarDialog) return
    if (!motivoRechazo.trim()) {
      toast.error('Ingresa un motivo de rechazo')
      return
    }
    startTransition(async () => {
      const result = await rechazarPreInscripcion(rechazarDialog.id, motivoRechazo.trim())
      if (result.ok) {
        toast.success(result.message)
        setRechazarDialog(null)
        setMotivoRechazo('')
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleMarcarEnRevision(id: string) {
    startTransition(async () => {
      const result = await marcarEnRevision(id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  // Stats data
  const statsCards = [
    { key: 'todas', label: 'Total', value: stats.total, colorClass: 'text-foreground' },
    { key: 'pendiente', label: 'Pendientes', value: stats.pendiente, colorClass: 'text-warning-600 dark:text-warning-400' },
    { key: 'en_revision', label: 'En revision', value: stats.en_revision, colorClass: 'text-info-600 dark:text-info-400' },
    { key: 'aprobada', label: 'Aprobadas', value: stats.aprobada, colorClass: 'text-success-600 dark:text-success-400' },
    { key: 'rechazada', label: 'Rechazadas', value: stats.rechazada, colorClass: 'text-error-600 dark:text-error-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Pre-inscripciones</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statsCards.map((s) => (
          <Card
            key={s.key}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filtroActual === s.key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleFiltro(s.key)}
          >
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.colorClass}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const Icon = f.icon
          const isActive = filtroActual === f.key
          return (
            <Button
              key={f.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFiltro(f.key)}
            >
              <Icon className="h-3.5 w-3.5 mr-1" />
              {f.label}
            </Button>
          )
        })}
      </div>

      {/* Contenido */}
      {inscripciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay pre-inscripciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filtroActual !== 'todas'
                ? `No hay inscripciones con estado "${estadoLabel(filtroActual)}".`
                : 'Todavia no se recibieron pre-inscripciones.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Nombre completo</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscripciones.map((ins) => (
                    <DesktopRow
                      key={ins.id}
                      inscripcion={ins}
                      expanded={expandedId === ins.id}
                      onToggleExpand={() =>
                        setExpandedId(expandedId === ins.id ? null : ins.id)
                      }
                      onAprobar={() => setAprobarDialog(ins)}
                      onRechazar={() => {
                        setRechazarDialog(ins)
                        setMotivoRechazo('')
                      }}
                      onRevisar={() => handleMarcarEnRevision(ins.id)}
                      isPending={isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {inscripciones.map((ins) => (
              <MobileCard
                key={ins.id}
                inscripcion={ins}
                expanded={expandedId === ins.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === ins.id ? null : ins.id)
                }
                onAprobar={() => setAprobarDialog(ins)}
                onRechazar={() => {
                  setRechazarDialog(ins)
                  setMotivoRechazo('')
                }}
                onRevisar={() => handleMarcarEnRevision(ins.id)}
                isPending={isPending}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialog Aprobar */}
      <Dialog open={!!aprobarDialog} onOpenChange={(open) => { if (!open) setAprobarDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar inscripcion?</DialogTitle>
            <DialogDescription>
              Se creara una nueva persona en el sistema o se vinculara si ya existe una con el mismo DNI.
            </DialogDescription>
          </DialogHeader>
          {aprobarDialog && (
            <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
              <p><span className="font-medium">Nombre:</span> {aprobarDialog.apellido}, {aprobarDialog.nombre}</p>
              <p><span className="font-medium">DNI:</span> {aprobarDialog.numero_documento || 'Sin documento'}</p>
              {aprobarDialog.fecha_nacimiento && (
                <p><span className="font-medium">Fecha nac.:</span> {formatFecha(aprobarDialog.fecha_nacimiento)} ({calcularEdad(aprobarDialog.fecha_nacimiento)} anios)</p>
              )}
              {aprobarDialog.disciplina_interes && (
                <p><span className="font-medium">Disciplina:</span> {aprobarDialog.disciplina_interes}</p>
              )}
              {aprobarDialog.es_menor && (
                <p><span className="font-medium">Tutor:</span> {aprobarDialog.tutor_nombre} {aprobarDialog.tutor_apellido}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprobarDialog(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleAprobar} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazar */}
      <Dialog open={!!rechazarDialog} onOpenChange={(open) => { if (!open) { setRechazarDialog(null); setMotivoRechazo('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar inscripcion</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. El solicitante podra verlo.
            </DialogDescription>
          </DialogHeader>
          {rechazarDialog && (
            <div className="text-sm text-muted-foreground mb-2">
              <p>Inscripcion de <span className="font-medium text-foreground">{rechazarDialog.apellido}, {rechazarDialog.nombre}</span></p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="motivo-rechazo">Motivo del rechazo *</Label>
            <Textarea
              id="motivo-rechazo"
              placeholder="Explicar el motivo del rechazo..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRechazarDialog(null); setMotivoRechazo('') }} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              <X className="h-3.5 w-3.5 mr-1" />
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -------------------------------------------------------------------
// Desktop table row
// -------------------------------------------------------------------

interface RowProps {
  inscripcion: PreInscripcion
  expanded: boolean
  onToggleExpand: () => void
  onAprobar: () => void
  onRechazar: () => void
  onRevisar: () => void
  isPending: boolean
}

function DesktopRow({ inscripcion, expanded, onToggleExpand, onAprobar, onRechazar, onRevisar, isPending }: RowProps) {
  const ins = inscripcion

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggleExpand}>
        <TableCell>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-medium">{ins.apellido}, {ins.nombre}</TableCell>
        <TableCell>{ins.numero_documento || '-'}</TableCell>
        <TableCell>{calcularEdad(ins.fecha_nacimiento)}</TableCell>
        <TableCell>{ins.disciplina_interes || '-'}</TableCell>
        <TableCell>
          <Badge variant={estadoBadgeVariant(ins.estado)} className={estadoBadgeClass(ins.estado)}>
            {estadoLabel(ins.estado)}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{formatFecha(ins.created_at)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <AccionesMenu
            inscripcion={ins}
            onAprobar={onAprobar}
            onRechazar={onRechazar}
            onRevisar={onRevisar}
            isPending={isPending}
          />
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <DetalleExpandido inscripcion={ins} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// -------------------------------------------------------------------
// Mobile card
// -------------------------------------------------------------------

function MobileCard({ inscripcion, expanded, onToggleExpand, onAprobar, onRechazar, onRevisar, isPending }: RowProps) {
  const ins = inscripcion

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={onToggleExpand}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">{ins.apellido}, {ins.nombre}</p>
              <Badge variant={estadoBadgeVariant(ins.estado)} className={`text-[10px] ${estadoBadgeClass(ins.estado)}`}>
                {estadoLabel(ins.estado)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {ins.numero_documento && <span>DNI: {ins.numero_documento}</span>}
              <span>Edad: {calcularEdad(ins.fecha_nacimiento)}</span>
              {ins.disciplina_interes && <span>{ins.disciplina_interes}</span>}
              <span>{formatFecha(ins.created_at)}</span>
            </div>
          </div>
          <AccionesMenu
            inscripcion={ins}
            onAprobar={onAprobar}
            onRechazar={onRechazar}
            onRevisar={onRevisar}
            isPending={isPending}
          />
        </div>

        {expanded && <DetalleExpandido inscripcion={ins} />}
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Acciones dropdown
// -------------------------------------------------------------------

interface AccionesMenuProps {
  inscripcion: PreInscripcion
  onAprobar: () => void
  onRechazar: () => void
  onRevisar: () => void
  isPending: boolean
}

function AccionesMenu({ inscripcion, onAprobar, onRechazar, onRevisar, isPending }: AccionesMenuProps) {
  const estado = inscripcion.estado

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={isPending} />}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Acciones</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {estado === 'pendiente' && (
          <>
            <DropdownMenuItem onClick={onRevisar}>
              <Eye className="h-4 w-4 mr-2" />
              Revisar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAprobar}>
              <Check className="h-4 w-4 mr-2" />
              Aprobar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRechazar}>
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </DropdownMenuItem>
          </>
        )}
        {estado === 'en_revision' && (
          <>
            <DropdownMenuItem onClick={onAprobar}>
              <Check className="h-4 w-4 mr-2" />
              Aprobar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRechazar}>
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </DropdownMenuItem>
          </>
        )}
        {estado === 'aprobada' && inscripcion.persona_id && (
          <DropdownMenuItem render={<Link href={`/admin/personas/${inscripcion.persona_id}`} />}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ver persona
          </DropdownMenuItem>
        )}
        {estado === 'rechazada' && (
          <DropdownMenuItem disabled>
            <X className="h-4 w-4 mr-2" />
            {inscripcion.motivo_rechazo || 'Sin motivo'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// -------------------------------------------------------------------
// Detalle expandido
// -------------------------------------------------------------------

function DetalleExpandido({ inscripcion }: { inscripcion: PreInscripcion }) {
  const ins = inscripcion

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Documento</p>
          <p>{ins.tipo_documento || 'DNI'}: {ins.numero_documento || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Fecha nacimiento</p>
          <p>{ins.fecha_nacimiento ? formatFecha(ins.fecha_nacimiento) : '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Sexo</p>
          <p>{ins.sexo || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Email</p>
          <p>{ins.email || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Telefono</p>
          <p>{ins.telefono || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Disciplina</p>
          <p>{ins.disciplina_interes || '-'}</p>
        </div>
        {ins.posicion_interes && (
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Posicion</p>
            <p>{ins.posicion_interes}</p>
          </div>
        )}
      </div>

      {ins.experiencia && (
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Experiencia</p>
          <p className="bg-muted/50 rounded p-2">{ins.experiencia}</p>
        </div>
      )}

      {ins.mensaje && (
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Mensaje</p>
          <p className="bg-muted/50 rounded p-2">{ins.mensaje}</p>
        </div>
      )}

      {ins.es_menor && (
        <div className="border rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Datos del tutor (menor de edad)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Tutor</p>
              <p>{ins.tutor_nombre} {ins.tutor_apellido}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Relacion</p>
              <p>{ins.tutor_relacion || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Email tutor</p>
              <p>{ins.tutor_email || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Telefono tutor</p>
              <p>{ins.tutor_telefono || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {ins.motivo_rechazo && (
        <div className="border border-error-200 dark:border-error-900 bg-error-50 dark:bg-error-950/30 rounded-lg p-3">
          <p className="text-xs font-medium text-error-600 dark:text-error-400 mb-0.5">Motivo de rechazo</p>
          <p className="text-error-800 dark:text-error-300">{ins.motivo_rechazo}</p>
        </div>
      )}

      {ins.reviewed_at && (
        <p className="text-xs text-muted-foreground">
          Revisada el {formatFecha(ins.reviewed_at)}
        </p>
      )}
    </div>
  )
}
