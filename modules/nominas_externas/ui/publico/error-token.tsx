'use client'

export function ErrorToken() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4" data-testid="error-token">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl text-red-600">!</span>
        </div>
        <h1 className="text-lg font-bold text-neutral-900 mb-2">Link no válido o caducado</h1>
        <p className="text-sm text-neutral-500">
          Este link puede haber expirado o no ser válido.
          Contactá al organizador para obtener uno nuevo.
        </p>
      </div>
    </div>
  )
}
