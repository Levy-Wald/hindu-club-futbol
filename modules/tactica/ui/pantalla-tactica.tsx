import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { obtenerEsquemaPorEvento, obtenerPlantelParaEvento } from '../lib/queries'
import { canEditarTactica } from '../lib/permisos'
import { EditorTactico } from './editor-tactico'

export async function PantallaTactica({
  eventoId,
  personaId,
  tenantId,
}: {
  eventoId: string
  personaId: string
  tenantId: string
}) {
  const [esquema, plantel, puedeEditar] = await Promise.all([
    obtenerEsquemaPorEvento(eventoId, tenantId),
    obtenerPlantelParaEvento(eventoId, tenantId),
    canEditarTactica(personaId, eventoId),
  ])

  return (
    <div className="container mx-auto p-4 max-w-5xl" data-testid="pantalla-tactica">
      <div className="mb-4">
        <Link
          href={`/admin/${tenantId}/operaciones/eventos/${eventoId}/asistencia`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al evento
        </Link>
        <h1 className="text-2xl font-bold">Tactica</h1>
      </div>

      <EditorTactico
        eventoId={eventoId}
        esquemaInicial={esquema}
        plantel={plantel}
        puedeEditar={puedeEditar}
      />
    </div>
  )
}
