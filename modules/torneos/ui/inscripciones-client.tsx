'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { Inscripcion } from '../lib/inscripciones-actions'
import { eliminarInscripcionAction } from '../lib/inscripciones-actions'
import type { TorneoHidratado, Federacion, EquipoPropio } from '../lib/types'
import { ModalInscribirEquipo } from './modal-inscribir-equipo'

export function InscripcionesClient({
  inscripciones,
  torneosExternos,
  federaciones,
  equiposPropios,
  puedeAdmin,
}: {
  inscripciones: Inscripcion[]
  torneosExternos: TorneoHidratado[]
  federaciones: Federacion[]
  equiposPropios: EquipoPropio[]
  puedeAdmin: boolean
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta inscripción?')) return
    setEliminando(id)
    const res = await eliminarInscripcionAction({ inscripcion_id: id })
    if (!res.ok) alert(res.error)
    setEliminando(null)
    router.refresh()
  }

  return (
    <div data-testid="pantalla-inscripciones">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inscripciones en torneos externos</h1>
        {puedeAdmin && (
          <Button
            data-testid="btn-inscribir-equipo"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Inscribir equipo
          </Button>
        )}
      </div>

      {inscripciones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay equipos inscriptos en torneos externos.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Torneo</TableHead>
                <TableHead>Federación</TableHead>
                <TableHead>Categoría externa</TableHead>
                <TableHead># Afiliación</TableHead>
                {puedeAdmin && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscripciones.map((insc) => (
                <TableRow key={insc.id}>
                  <TableCell className="font-medium">{insc.equipo_nombre}</TableCell>
                  <TableCell>{insc.torneo_formal_nombre ?? insc.torneo_nombre}</TableCell>
                  <TableCell>{insc.federacion_nombre ?? '—'}</TableCell>
                  <TableCell>{insc.categoria_externa ?? '—'}</TableCell>
                  <TableCell>{insc.numero_afiliacion ?? '—'}</TableCell>
                  {puedeAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminar(insc.id)}
                        disabled={eliminando === insc.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {modalOpen && (
        <ModalInscribirEquipo
          torneosExternos={torneosExternos}
          equiposPropios={equiposPropios}
          onClose={() => {
            setModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
