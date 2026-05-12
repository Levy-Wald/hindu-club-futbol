'use client'

import { Check, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResultadoVerificacion, VeredictoAcceso } from '../lib/types'

const VEREDICTO_CONFIG: Record<VeredictoAcceso, {
  bg: string
  icon: typeof Check
  label: string
}> = {
  verde: { bg: 'bg-green-500', icon: Check, label: 'ACCESO PERMITIDO' },
  amarillo: { bg: 'bg-yellow-500', icon: AlertTriangle, label: 'ADVERTENCIA' },
  rojo: { bg: 'bg-red-500', icon: X, label: 'ACCESO DENEGADO' },
}

type Props = {
  resultado: ResultadoVerificacion
}

export function CardVeredicto({ resultado }: Props) {
  const config = VEREDICTO_CONFIG[resultado.veredicto]
  const Icon = config.icon

  const razon = resultado.es_socio
    ? 'Socio activo del club'
    : resultado.es_visitante_temporal
      ? 'Visitante temporal con acceso vigente'
      : resultado.invitaciones_hoy.length > 0
        ? `Invitado a ${resultado.invitaciones_hoy.length} evento(s) de hoy`
        : resultado.invitaciones_otro_dia.length > 0
          ? 'Invitación a evento de otra fecha'
          : 'No es socio ni tiene invitaciones'

  return (
    <div
      data-testid="card-veredicto"
      className="rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Veredicto header */}
      <div
        data-testid={`veredicto-color-${resultado.veredicto}`}
        className={cn(config.bg, 'px-6 py-8 text-white text-center')}
      >
        <Icon className="h-16 w-16 mx-auto mb-3" strokeWidth={3} />
        <p className="text-2xl font-black tracking-wide">{config.label}</p>
        <p className="text-sm mt-1 opacity-90">{razon}</p>
      </div>

      {/* Persona info */}
      <div className="bg-white px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          {resultado.foto_url ? (
            <img
              src={resultado.foto_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-sm font-medium text-neutral-600">
              {resultado.apellido?.[0]}{resultado.nombre?.[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-neutral-900" data-testid="dato-persona-nombre">
              {resultado.apellido}, {resultado.nombre}
            </p>
            <p className="text-sm text-neutral-500" data-testid="dato-persona-dni">
              DNI: {resultado.dni}
            </p>
          </div>
        </div>
      </div>

      {/* Visitante temporal info */}
      {resultado.es_visitante_temporal && resultado.visitante_info && (
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100" data-testid="visitante-temporal-info">
          <p className="text-sm font-medium text-blue-800">
            Visitante temporal — {resultado.visitante_info.padron_nombre}
          </p>
          {resultado.visitante_info.vigencia_hasta && (
            <p className="text-xs text-blue-600 mt-0.5">
              Vigencia hasta: {new Date(resultado.visitante_info.vigencia_hasta).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
