'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  TorneoHidratado,
  Categoria,
  EquipoInscripto,
  EquipoPropio,
} from '../lib/types'
import { quitarEquipoAction } from '../lib/actions'
import { ModalAgregarEquipo } from './modal-agregar-equipo'

export function TabEquiposInscriptos({
  torneo,
  categorias,
  equipos,
  equiposPropios,
  puedeAdmin,
}: {
  torneo: TorneoHidratado
  categorias: Categoria[]
  equipos: EquipoInscripto[]
  equiposPropios: EquipoPropio[]
  puedeAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)

  function handleQuitar(id: string) {
    startTransition(async () => {
      const result = await quitarEquipoAction({ equipo_inscripto_id: id })
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="mt-4">
      {puedeAdmin && (
        <div className="mb-4">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            data-testid="btn-agregar-equipo"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar equipo
          </Button>
        </div>
      )}

      <div className="rounded-md border" data-testid="tabla-equipos-inscriptos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              {puedeAdmin && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={puedeAdmin ? 4 : 3}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay equipos inscriptos
                </TableCell>
              </TableRow>
            ) : (
              equipos.map((eq) => (
                <TableRow key={eq.id} data-testid={`fila-equipo-${eq.id}`}>
                  <TableCell className="font-medium">
                    {eq.equipo_nombre}
                  </TableCell>
                  <TableCell>
                    {eq.equipo_id ? 'Propio' : 'Externo'}
                  </TableCell>
                  <TableCell>
                    {eq.categoria_nombre ?? '—'}
                  </TableCell>
                  {puedeAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuitar(eq.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {modalOpen && (
        <ModalAgregarEquipo
          torneoId={torneo.id}
          categorias={categorias}
          equiposPropios={equiposPropios}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
