'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { probarPlantilla } from '@/modules/comunicaciones/lib/actions'

interface EnviarPruebaButtonProps {
  plantillaId: string
  disabled?: boolean
}

export function EnviarPruebaButton({ plantillaId, disabled }: EnviarPruebaButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await probarPlantilla(plantillaId)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending || disabled}
      data-testid="enviar-prueba-button"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      Enviar prueba
    </Button>
  )
}
