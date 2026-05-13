'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { BadgeEstado } from './badge-estado'
import { ModalNuevaReserva } from './modal-nueva-reserva'
import { ModalDetalleReserva } from './modal-detalle-reserva'
import type { ReservaHidratada, CanchaDisponible } from '../lib/types'

export function TablaReservas({
  reservas: reservasIniciales,
  canchas,
  canchasConReservas,
  puedeEditar,
}: {
  reservas: ReservaHidratada[]
  canchas: CanchaDisponible[]
  canchasConReservas: { id: string; nombre: string }[]
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [modalNueva, setModalNueva] = useState(false)
  const [reservaDetalle, setReservaDetalle] = useState<ReservaHidratada | null>(null)

  // Filtros (client-side para MVP)
  const [filtroCancha, setFiltroCancha] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  let reservas = reservasIniciales
  if (filtroCancha) {
    reservas = reservas.filter(r => r.cancha_id === filtroCancha)
  }
  if (filtroEstado) {
    reservas = reservas.filter(r => r.estado === filtroEstado)
  }

  const formatHora = (h: string) => h?.slice(0, 5) ?? ''

  return (
    <div className="space-y-4" data-testid="pantalla-reservas">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reservas de canchas</h1>
        {puedeEditar && (
          <Button onClick={() => setModalNueva(true)} data-testid="btn-nueva-reserva">
            <Plus className="h-4 w-4 mr-1" />
            Nueva reserva
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Select value={filtroCancha} onValueChange={(v) => setFiltroCancha(v === '__all__' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-[180px]" data-testid="filtro-cancha">
            <SelectValue placeholder="Todas las canchas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las canchas</SelectItem>
            {canchasConReservas.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v === '__all__' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-[160px]" data-testid="filtro-estado">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {reservas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm" data-testid="tabla-reservas">
          No hay reservas registradas.
        </div>
      ) : (
        <div className="overflow-x-auto" data-testid="tabla-reservas">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3 font-medium">Fecha</th>
                <th className="py-2 px-3 font-medium">Hora</th>
                <th className="py-2 px-3 font-medium">Cancha</th>
                <th className="py-2 px-3 font-medium">Cliente</th>
                <th className="py-2 px-3 font-medium">Estado</th>
                <th className="py-2 px-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-accent/50 cursor-pointer"
                  onClick={() => setReservaDetalle(r)}
                  data-testid={`fila-reserva-${r.id}`}
                >
                  <td className="py-2 px-3">{r.evento.fecha}</td>
                  <td className="py-2 px-3">
                    {formatHora(r.evento.hora_inicio)}-{formatHora(r.evento.hora_fin ?? '')}
                  </td>
                  <td className="py-2 px-3">{r.cancha.nombre}</td>
                  <td className="py-2 px-3 font-medium">{r.cliente_display}</td>
                  <td className="py-2 px-3">
                    <BadgeEstado estado={r.estado} />
                  </td>
                  <td className="py-2 px-3 text-right">
                    {r.tarifa_total != null ? `$${r.tarifa_total.toLocaleString('es-AR')}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ModalNuevaReserva
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        onCreated={() => router.refresh()}
        canchas={canchas}
      />
      <ModalDetalleReserva
        reserva={reservaDetalle}
        onClose={() => setReservaDetalle(null)}
        onUpdated={() => router.refresh()}
        puedeEditar={puedeEditar}
      />
    </div>
  )
}
