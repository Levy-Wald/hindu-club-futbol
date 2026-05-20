'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function TroncalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TroncalError]', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">Error al cargar la pagina</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'Ocurrio un error inesperado.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  )
}
