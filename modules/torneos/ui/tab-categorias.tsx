'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import type { TorneoHidratado, Categoria } from '../lib/types'
import { ModalAgregarCategoria } from './modal-agregar-categoria'

export function TabCategorias({
  torneo,
  categorias,
  puedeAdmin,
}: {
  torneo: TorneoHidratado
  categorias: Categoria[]
  puedeAdmin: boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="mt-4">
      {puedeAdmin && (
        <div className="mb-4">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            data-testid="btn-agregar-categoria"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar categoria
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Max equipos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay categorias definidas
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.orden}</TableCell>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right">
                    {c.num_equipos_max ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {modalOpen && (
        <ModalAgregarCategoria
          torneoId={torneo.id}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
