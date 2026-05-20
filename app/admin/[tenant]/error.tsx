'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Algo salio mal</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'Ocurrio un error inesperado.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Ir al inicio
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Codigo: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
