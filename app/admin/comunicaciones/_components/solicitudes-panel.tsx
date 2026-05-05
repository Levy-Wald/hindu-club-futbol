'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Check, X, Clock } from 'lucide-react'
import { aprobarSolicitud, rechazarSolicitud } from '../_actions'

interface Solicitud {
  id: string
  tipo: string
  estado: string
  datos: Record<string, unknown>
  created_at: string
  motivo_rechazo: string | null
  solicitante: { id: string; nombre: string; apellido: string } | null
}

interface SolicitudesPanelProps {
  solicitudes: Solicitud[]
}

export function SolicitudesPanel({ solicitudes }: SolicitudesPanelProps) {
  if (solicitudes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay solicitudes pendientes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Solicitudes pendientes
          <Badge>{solicitudes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {solicitudes.map((s) => (
          <SolicitudItem key={s.id} solicitud={s} />
        ))}
      </CardContent>
    </Card>
  )
}

function SolicitudItem({ solicitud }: { solicitud: Solicitud }) {
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [showRechazo, setShowRechazo] = useState(false)
  const [isPending, startTransition] = useTransition()

  const solicitante = solicitud.solicitante
  const datos = solicitud.datos
  const fecha = new Date(solicitud.created_at).toLocaleDateString('es-AR')

  function handleAprobar() {
    startTransition(async () => {
      const result = await aprobarSolicitud(solicitud.id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  function handleRechazar() {
    startTransition(async () => {
      const result = await rechazarSolicitud(solicitud.id, motivoRechazo)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={solicitud.tipo === 'ingreso_equipo' ? 'default' : 'secondary'} className="text-xs">
              {solicitud.tipo === 'ingreso_equipo' ? 'Ingreso equipo' : 'Cambio datos'}
            </Badge>
            <span className="text-xs text-muted-foreground">{fecha}</span>
          </div>
          <p className="text-sm font-medium mt-1">
            {solicitante ? `${solicitante.apellido}, ${solicitante.nombre}` : 'Desconocido'}
          </p>
        </div>
      </div>

      {/* Detalles según tipo */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
        {solicitud.tipo === 'ingreso_equipo' && (
          <>
            <p>Rol solicitado: <span className="font-medium">{datos.rol_solicitado as string}</span></p>
            {datos.mensaje && <p className="mt-1">Mensaje: {datos.mensaje as string}</p>}
          </>
        )}
        {solicitud.tipo === 'cambio_datos' && (
          <>
            <p>Campo: <span className="font-medium">{datos.campo as string}</span></p>
            <p>Actual: {(datos.valor_actual as string) || '-'}</p>
            <p>Nuevo: <span className="font-medium">{datos.valor_nuevo as string}</span></p>
          </>
        )}
      </div>

      {/* Acciones */}
      {!showRechazo ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAprobar} disabled={isPending}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Aprobar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setShowRechazo(true)} disabled={isPending}>
            <X className="h-3.5 w-3.5 mr-1" />
            Rechazar
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Motivo del rechazo (opcional)"
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="destructive" onClick={handleRechazar} disabled={isPending}>
            Confirmar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRechazo(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
