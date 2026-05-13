'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TorneoHidratado, Federacion } from '../lib/types'
import { FORMATOS } from '../lib/formatos'
import { FiltrosTorneos } from './filtros-torneos'
import { ModalNuevoTorneo } from './modal-nuevo-torneo'
import { BadgeEstadoTorneo } from './badge-estado-torneo'

export function TablaTorneos({
  torneos,
  federaciones,
  puedeAdmin,
}: {
  torneos: TorneoHidratado[]
  federaciones: Federacion[]
  puedeAdmin: boolean
}) {
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFederacion, setFiltroFederacion] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filtrados = torneos.filter((t) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false
    if (filtroEstado && t.estado !== filtroEstado) return false
    if (filtroFederacion && t.federacion_id !== filtroFederacion) return false
    if (busqueda && !t.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const getFormatoLabel = (slug: string) =>
    FORMATOS.find((f) => f.slug === slug)?.nombre ?? slug

  return (
    <div data-testid="pantalla-torneos">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Torneos</h1>
          <p className="text-muted-foreground text-sm">
            Competencias internas y externas
          </p>
        </div>
        {puedeAdmin && (
          <Button
            data-testid="btn-nuevo-torneo"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo torneo
          </Button>
        )}
      </div>

      <FiltrosTorneos
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroFederacion={filtroFederacion}
        setFiltroFederacion={setFiltroFederacion}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        federaciones={federaciones}
      />

      <div data-testid="tabla-torneos" className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Equipos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay torneos registrados
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((t) => (
                <TableRow
                  key={t.id}
                  data-testid={`fila-torneo-${t.id}`}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <Link
                      href={`/admin/competencias/torneos/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.nombre}
                    </Link>
                    {t.federacion_nombre && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.federacion_nombre})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{t.tipo}</TableCell>
                  <TableCell className="text-sm">{getFormatoLabel(t.formato)}</TableCell>
                  <TableCell>
                    <BadgeEstadoTorneo estado={t.estado} />
                  </TableCell>
                  <TableCell className="text-right">{t.equipos_count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {modalOpen && (
        <ModalNuevoTorneo
          federaciones={federaciones}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
