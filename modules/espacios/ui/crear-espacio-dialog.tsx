'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EspacioForm } from './espacio-form'
import { crearEspacioAction } from '../lib/actions'
import type { TipoEspacio, TipoEspacioSlug } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface CrearEspacioDialogProps {
  sedes: { id: string; nombre: string }[]
  tiposEspacio: TipoEspacio[]
  sedeIdPreseleccionada?: string
  label?: string
}

export function CrearEspacioDialog({
  sedes,
  tiposEspacio,
  sedeIdPreseleccionada,
  label = 'Nuevo espacio',
}: CrearEspacioDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-testid="btn-nuevo-espacio" />}>
        <Plus className="h-4 w-4 mr-2" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <EspacioForm
          sedes={sedes}
          tiposEspacio={tiposEspacio}
          espacio={sedeIdPreseleccionada ? { sede_id: sedeIdPreseleccionada } as any : undefined}
          onSubmit={async (data) => {
            const result = await crearEspacioAction({
              ...data,
              tipo_slug: data.tipo_slug as TipoEspacioSlug,
            })
            if (result.ok) {
              setOpen(false)
              router.refresh()
            }
            return result
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
