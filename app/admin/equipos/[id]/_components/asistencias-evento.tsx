'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { registrarAsistencia, generarAsistenciasEvento } from '@/app/admin/operaciones/_actions'

// --- Tipos ---

interface AsistenciaRow {
  id: string
  persona_id: string
  estado: string
  nota: string | null
  respondido_at: string | null
  persona: {
    id: string
    nombre: string
    apellido: string
    numero_documento: string | null
    foto_perfil_url: string | null
  } | null
}

interface AsistenciasEventoProps {
  eventoId: string
  equipoId: string
}

// --- Constantes ---

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'rechazado', label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'presente', label: 'Presente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'ausente', label: 'Ausente', color: 'bg-gray-100 text-gray-800 border-gray-200' },
]

function getEstadoConfig(estado: string) {
  return ESTADOS.find((e) => e.value === estado) ?? ESTADOS[0]
}

// --- Componente ---

export function AsistenciasEvento({ eventoId, equipoId }: AsistenciasEventoProps) {
  const [asistencias, setAsistencias] = useState<AsistenciaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/asistencias/${eventoId}`)
      if (res.ok) {
        const data = await res.json()
        setAsistencias(data)
      }
    } catch {
      // silently fail, will show empty state
    } finally {
      setLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleCambiarEstado(personaId: string, nuevoEstado: string) {
    startTransition(async () => {
      const result = await registrarAsistencia({
        evento_id: eventoId,
        persona_id: personaId,
        estado: nuevoEstado,
      })
      if (result.ok) {
        // Update local state
        setAsistencias((prev) =>
          prev.map((a) =>
            a.persona_id === personaId
              ? { ...a, estado: nuevoEstado, respondido_at: nuevoEstado !== 'pendiente' ? new Date().toISOString() : null }
              : a
          )
        )
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleGenerarLista() {
    startTransition(async () => {
      const result = await generarAsistenciasEvento(eventoId, equipoId)
      if (result.ok) {
        toast.success(result.message)
        fetchData()
      } else {
        toast.error(result.message)
      }
    })
  }

  // Summary
  const resumen = ESTADOS.reduce(
    (acc, e) => {
      acc[e.value] = asistencias.filter((a) => a.estado === e.value).length
      return acc
    },
    {} as Record<string, number>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerarLista}
          disabled={isPending}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Generar lista
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Summary bar */}
      {asistencias.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {ESTADOS.map((e) => {
            const count = resumen[e.value] ?? 0
            if (count === 0) return null
            return (
              <Badge key={e.value} variant="outline" className={`${e.color} text-[11px]`}>
                {count} {e.label.toLowerCase()}
              </Badge>
            )
          })}
          <span className="text-muted-foreground ml-1">
            Total: {asistencias.length}
          </span>
        </div>
      )}

      {/* List */}
      {asistencias.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay asistencias registradas. Usa &quot;Generar lista&quot; para crear entradas para todos los miembros del equipo.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {asistencias.map((a) => {
            const cfg = getEstadoConfig(a.estado)
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-2.5"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 overflow-hidden">
                  {a.persona?.foto_perfil_url ? (
                    <img
                      src={a.persona.foto_perfil_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(a.persona?.nombre?.[0] ?? '').toUpperCase()}
                      {(a.persona?.apellido?.[0] ?? '').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.persona?.apellido}, {a.persona?.nombre}
                  </p>
                  {a.persona?.numero_documento && (
                    <p className="text-[11px] text-muted-foreground">
                      DNI {a.persona.numero_documento}
                    </p>
                  )}
                </div>

                {/* Status select */}
                <Select
                  value={a.estado}
                  onValueChange={(v) => handleCambiarEstado(a.persona_id, v ?? a.estado)}
                >
                  <SelectTrigger className={`w-[130px] h-8 text-xs ${cfg.color}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
