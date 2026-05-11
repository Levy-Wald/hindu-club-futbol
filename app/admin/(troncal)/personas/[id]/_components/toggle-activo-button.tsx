'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import { cambiarEstadoPersona } from '../../_actions'

interface ToggleActivoButtonProps {
  personaId: string
  personaEstado: string
}

export function ToggleActivoButton({ personaId, personaEstado }: ToggleActivoButtonProps) {
  const [isPending, startTransition] = useTransition()
  const isActivo = personaEstado === 'activo'

  function handleToggle() {
    startTransition(async () => {
      const nuevoEstado = isActivo ? 'inactivo' : 'activo'
      const result = await cambiarEstadoPersona(personaId, nuevoEstado)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <Button
      variant={isActivo ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      <Power className="h-3.5 w-3.5 sm:mr-2" />
      <span className="hidden sm:inline">{isActivo ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )
}
