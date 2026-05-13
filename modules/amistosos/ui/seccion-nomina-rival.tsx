'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardCopy, ExternalLink, FileText } from 'lucide-react'
import { generarNominaParaAmistosoAction } from '../lib/actions'

const ESTADO_LABELS: Record<string, { text: string; className: string }> = {
  pendiente: { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
  completada: { text: 'Completada', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  caducada: { text: 'Caducada', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  cancelada: { text: 'Cancelada', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export function SeccionNominaRival({
  eventoId,
  nominaId,
  nominaToken,
  nominaEstado,
  clubRivalNombre,
  puedeEditar,
}: {
  eventoId: string
  nominaId: string | null
  nominaToken: string | null
  nominaEstado: string | null
  clubRivalNombre: string | null
  puedeEditar: boolean
}) {
  const [generando, setGenerando] = useState(false)
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null)
  const [idGenerado, setIdGenerado] = useState<string | null>(nominaId)
  const [tokenGenerado, setTokenGenerado] = useState<string | null>(nominaToken)
  const [estadoActual, setEstadoActual] = useState(nominaEstado)
  const [copiado, setCopiado] = useState(false)

  const tieneNomina = !!idGenerado

  const handleGenerar = async () => {
    setGenerando(true)
    const result = await generarNominaParaAmistosoAction({
      evento_id: eventoId,
      club_rival_nombre: clubRivalNombre ?? undefined,
    })
    setGenerando(false)
    if (result.ok) {
      setLinkGenerado(result.url)
      setIdGenerado(result.nomina_id)
      setEstadoActual('pendiente')
    }
  }

  const nominaUrl = linkGenerado ?? (nominaToken ? `/nomina/${nominaToken}` : null)

  const handleCopiar = async () => {
    if (!nominaUrl) return
    const fullUrl = window.location.origin + nominaUrl
    await navigator.clipboard.writeText(fullUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const estadoInfo = estadoActual ? ESTADO_LABELS[estadoActual] : null

  return (
    <div className="border rounded-lg p-4 mb-4" data-testid="seccion-nomina-rival">
      <h3 className="font-semibold text-sm mb-3">Nómina del rival</h3>

      {!tieneNomina ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Generá un link para que el rival cargue su nómina de jugadores.
          </p>
          {puedeEditar && (
            <button
              onClick={handleGenerar}
              disabled={generando}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              data-testid="btn-generar-nomina-rival"
            >
              {generando ? 'Generando...' : 'Generar link para que el rival cargue nómina'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {estadoInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Estado:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${estadoInfo.className}`}>
                {estadoInfo.text}
              </span>
            </div>
          )}

          {nominaUrl && (
            <div className="flex items-center gap-2">
              <a
                href={nominaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                data-testid="link-nomina-rival"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{nominaUrl}</span>
              </a>
              <button
                onClick={handleCopiar}
                className="p-1.5 hover:bg-accent rounded flex-shrink-0"
                title="Copiar link"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
              {copiado && <span className="text-xs text-green-600">Copiado</span>}
            </div>
          )}

          <Link
            href={`/admin/nominas-externas/${idGenerado}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver detalle de la nómina
          </Link>
        </div>
      )}
    </div>
  )
}
