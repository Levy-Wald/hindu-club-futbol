'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { confirmarItemAction } from '../../lib/actions'
import type { NominaItem } from '../../lib/types'

type NominaData = {
  id: string
  estado: string
  caduca_at: string
  nivel_validacion: string
  submissions_count: number
  evento: { titulo: string; fecha: string; hora_inicio: string | null } | null
  equipo_destino: { nombre: string } | null
  entidad_destino: { nombre: string } | null
}

type Props = {
  nomina: NominaData
  items: NominaItem[]
}

export function PantallaDetalle({ nomina, items: initialItems }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [procesando, setProcesando] = useState<string | null>(null)

  const pendientes = items.filter((i) => !i.procesada)
  const procesados = items.filter((i) => i.procesada)

  const handleConfirmar = async (itemId: string, decision: 'crear_nueva' | 'usar_match' | 'rechazar') => {
    setProcesando(itemId)
    const result = await confirmarItemAction({ item_id: itemId, decision })
    setProcesando(null)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(decision === 'rechazar' ? 'Rechazado' : 'Confirmado')
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, procesada: true, match_decision: decision === 'rechazar' ? 'rechazada' : i.match_decision } : i
      )
    )
  }

  const eventoData = nomina.evento

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push('/admin/nominas-externas')}
        className="text-sm text-brand-600 hover:text-brand-700"
      >
        ← Volver a nóminas
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h1 className="text-lg font-bold text-neutral-900">{eventoData?.titulo ?? 'Nómina'}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {eventoData?.fecha ?? ''} · Nivel {nomina.nivel_validacion} · {nomina.submissions_count} envío(s)
        </p>
        {nomina.equipo_destino && (
          <p className="text-sm text-brand-600 mt-0.5">Equipo: {nomina.equipo_destino.nombre}</p>
        )}
        {nomina.entidad_destino && (
          <p className="text-sm text-brand-600 mt-0.5">Entidad: {nomina.entidad_destino.nombre}</p>
        )}
        <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium mt-2 ${
          nomina.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
          nomina.estado === 'completada' ? 'bg-green-100 text-green-700' :
          'bg-neutral-100 text-neutral-500'
        }`}>
          {nomina.estado}
        </span>
      </div>

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">
            Pendientes de revisión ({pendientes.length})
          </h2>
          {pendientes.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              procesando={procesando === item.id}
              onConfirmar={handleConfirmar}
            />
          ))}
        </div>
      )}

      {pendientes.length === 0 && (
        <div className="py-8 text-center text-sm text-neutral-400">
          No hay items pendientes de revisión.
        </div>
      )}

      {/* Procesados */}
      {procesados.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-500">
            Procesados ({procesados.length})
          </h2>
          {procesados.map((item) => (
            <div key={item.id} className="bg-neutral-50 rounded-xl border border-neutral-100 p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  {item.tipo === 'persona' && item.persona_input && (
                    <p className="text-sm text-neutral-700">
                      {(item.persona_input as Record<string, string>).nombre}{' '}
                      {(item.persona_input as Record<string, string>).apellido}
                    </p>
                  )}
                  {item.tipo === 'entidad' && item.entidad_input && (
                    <p className="text-sm text-neutral-700">
                      {(item.entidad_input as Record<string, string>).nombre}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.match_decision === 'rechazada' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {item.match_decision === 'rechazada' ? 'Rechazada' : 'Confirmada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({
  item,
  procesando,
  onConfirmar,
}: {
  item: NominaItem
  procesando: boolean
  onConfirmar: (id: string, decision: 'crear_nueva' | 'usar_match' | 'rechazar') => void
}) {
  const input = item.tipo === 'persona'
    ? (item.persona_input as Record<string, string>)
    : (item.entidad_input as Record<string, string>)

  const isDuplicadaSocio = item.match_decision === 'duplicada_socio'

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${
      isDuplicadaSocio ? 'border-orange-300 bg-orange-50' : 'border-neutral-200'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {item.tipo === 'persona'
              ? `${input?.nombre ?? ''} ${input?.apellido ?? ''}`
              : input?.nombre ?? ''
            }
          </p>
          {input?.dni && <p className="text-xs text-neutral-500">DNI: {input.dni}</p>}
          {input?.rol && <p className="text-xs text-neutral-500">Rol: {input.rol}</p>}
          {input?.telefono && <p className="text-xs text-neutral-500">Tel: {input.telefono}</p>}
        </div>
        <div className="text-right">
          {item.match_confidence != null && (
            <p className="text-xs text-neutral-400">
              Match: {Math.round(item.match_confidence * 100)}%
            </p>
          )}
          {isDuplicadaSocio && (
            <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
              Ya es socio
            </span>
          )}
          {item.match_decision === 'posible_match' && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
              Posible match
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={procesando}
          onClick={() => onConfirmar(item.id, item.persona_id_match ? 'usar_match' : 'crear_nueva')}
          data-testid={`btn-confirmar-crear-${item.id}`}
          className="flex-1 h-9 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {procesando ? '...' : item.persona_id_match ? 'Usar match' : 'Crear nueva'}
        </button>
        <button
          type="button"
          disabled={procesando}
          onClick={() => onConfirmar(item.id, 'rechazar')}
          className="h-9 px-3 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
    </div>
  )
}
