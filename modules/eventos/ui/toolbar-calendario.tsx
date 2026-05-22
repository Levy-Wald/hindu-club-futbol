'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CrearEventoDialog } from './crear-evento-dialog'
import { FiltrosCalendario } from './filtros-calendario'

export function ToolbarCalendario({
  sedes,
  equipos,
  tenantId,
}: {
  sedes: { id: string; nombre: string }[]
  equipos: { id: string; nombre: string }[]
  tenantId: string
}) {
  const [crearOpen, setCrearOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button onClick={() => setCrearOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo evento
        </Button>
        <FiltrosCalendario equipos={equipos} tenantId={tenantId} />
      </div>

      <CrearEventoDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        sedes={sedes}
        equipos={equipos}
        tenantId={tenantId}
      />
    </>
  )
}
