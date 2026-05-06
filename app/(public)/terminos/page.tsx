import { fetchConfigPublica } from '../_lib/queries'

export default async function TerminosPage() {
  const config = await fetchConfigPublica()

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Términos y condiciones</h1>
        {config?.terminos_condiciones ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {config.terminos_condiciones}
          </div>
        ) : (
          <div className="space-y-6 text-sm text-muted-foreground">
            <p>
              Al utilizar este sitio web y enviar una pre-inscripción, usted acepta los siguientes términos:
            </p>
            <h2 className="text-lg font-semibold text-foreground">1. Uso del sitio</h2>
            <p>
              Este sitio web es propiedad de {config?.nombre_display || 'el club'} y tiene como objetivo brindar información
              sobre las actividades deportivas y facilitar el proceso de inscripción.
            </p>
            <h2 className="text-lg font-semibold text-foreground">2. Pre-inscripción</h2>
            <p>
              La pre-inscripción no garantiza la admisión. El club se reserva el derecho de aceptar o rechazar
              solicitudes según disponibilidad y criterios internos. Una vez aprobada, se coordinará el proceso
              de incorporación.
            </p>
            <h2 className="text-lg font-semibold text-foreground">3. Datos personales</h2>
            <p>
              Los datos proporcionados serán utilizados exclusivamente para la gestión deportiva del club,
              conforme a la Ley 25.326 de Protección de Datos Personales de la República Argentina.
              No se compartirán con terceros sin consentimiento previo.
            </p>
            <h2 className="text-lg font-semibold text-foreground">4. Datos de menores</h2>
            <p>
              Para inscripciones de menores de edad, se requiere el consentimiento expreso del padre, madre
              o tutor legal, quien será responsable de la veracidad de los datos proporcionados.
            </p>
            <h2 className="text-lg font-semibold text-foreground">5. Comunicaciones</h2>
            <p>
              Si acepta recibir comunicaciones, el club podrá enviar información sobre actividades,
              horarios, eventos y novedades por email o WhatsApp. Puede darse de baja en cualquier momento.
            </p>
            <h2 className="text-lg font-semibold text-foreground">6. Modificaciones</h2>
            <p>
              El club se reserva el derecho de modificar estos términos. Las modificaciones serán publicadas
              en este sitio web.
            </p>
            <p className="pt-4 text-xs">
              Última actualización: Mayo 2026
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
