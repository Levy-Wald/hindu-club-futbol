'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModalGenerarLink } from './modal-generar-link'

type NominaRow = {
  id: string
  estado: string
  created_at: string
  caduca_at: string
  submissions_count: number
  evento: { titulo: string; fecha: string } | null
  equipo_destino: { nombre: string } | null
  entidad_destino: { nombre: string } | null
  items_pendientes_count: number
}

type Props = { tenantId: string }

export function PantallaListado({ tenantId }: Props) {
  const router = useRouter()
  const [nominas, setNominas] = useState<NominaRow[]>([])
  const [filtro, setFiltro] = useState<'pendientes' | 'todas'>('pendientes')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('nominas_externas')
      .select(`
        id, estado, created_at, caduca_at, submissions_count,
        evento:eventos!inner(titulo, fecha),
        equipo_destino:equipos(nombre),
        entidad_destino:entidades(nombre)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filtro === 'pendientes') {
      query = query.eq('estado', 'pendiente')
    }

    const { data } = await query
    setNominas(
      (data ?? []).map((n: any) => ({
        ...n,
        evento: Array.isArray(n.evento) ? n.evento[0] : n.evento,
        equipo_destino: Array.isArray(n.equipo_destino) ? n.equipo_destino[0] : n.equipo_destino,
        entidad_destino: Array.isArray(n.entidad_destino) ? n.entidad_destino[0] : n.entidad_destino,
        items_pendientes_count: 0,
      }))
    )
    setLoading(false)
  }, [tenantId, filtro])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Nóminas externas</h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          data-testid="btn-generar-nomina"
          className="h-10 px-4 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
        >
          + Generar link
        </button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFiltro('pendientes')}
          className={`text-sm px-3 py-1.5 rounded-lg ${
            filtro === 'pendientes' ? 'bg-brand-100 text-brand-700 font-medium' : 'text-neutral-500'
          }`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          className={`text-sm px-3 py-1.5 rounded-lg ${
            filtro === 'todas' ? 'bg-brand-100 text-brand-700 font-medium' : 'text-neutral-500'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : nominas.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          No hay nóminas {filtro === 'pendientes' ? 'pendientes' : ''}.
        </p>
      ) : (
        <div className="space-y-2">
          {nominas.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => router.push(`/admin/nominas-externas/${n.id}`)}
              className="w-full text-left bg-white rounded-xl border border-neutral-200 p-4 hover:border-brand-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {n.evento?.titulo ?? 'Evento'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {n.evento?.fecha ?? ''}
                    {n.equipo_destino && ` · ${n.equipo_destino.nombre}`}
                    {n.entidad_destino && ` · ${n.entidad_destino.nombre}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  n.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                  n.estado === 'completada' ? 'bg-green-100 text-green-700' :
                  'bg-neutral-100 text-neutral-500'
                }`}>
                  {n.estado}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {n.submissions_count} envío(s) · Caduca {new Date(n.caduca_at).toLocaleDateString('es-AR')}
              </p>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <ModalGenerarLink
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); cargar() }}
        />
      )}
    </div>
  )
}
