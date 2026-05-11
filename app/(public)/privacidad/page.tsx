import { fetchConfigPublica } from '../_lib/queries'

export default async function PrivacidadPage() {
  const config = await fetchConfigPublica()

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Política de privacidad</h1>
        {config?.politica_privacidad ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {config.politica_privacidad}
          </div>
        ) : (
          <div className="space-y-6 text-sm text-muted-foreground">
            <p>
              {config?.nombre_display || 'El club'} se compromete a proteger la privacidad de los datos
              personales de sus usuarios conforme a la legislación vigente en la República Argentina.
            </p>
            <h2 className="text-lg font-semibold text-foreground">Datos que recopilamos</h2>
            <p>
              Recopilamos los datos que usted nos proporciona voluntariamente al completar formularios
              en nuestro sitio: nombre, apellido, documento, fecha de nacimiento, datos de contacto,
              y en caso de menores, datos del tutor responsable.
            </p>
            <h2 className="text-lg font-semibold text-foreground">Uso de los datos</h2>
            <p>Los datos recopilados se utilizan para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionar las pre-inscripciones y admisiones</li>
              <li>Organizar las actividades deportivas</li>
              <li>Comunicar horarios, eventos y novedades (si lo autorizó)</li>
              <li>Cumplir con requisitos de federaciones deportivas</li>
            </ul>
            <h2 className="text-lg font-semibold text-foreground">Protección de datos</h2>
            <p>
              Los datos se almacenan en servidores seguros con cifrado en tránsito y en reposo.
              El acceso está restringido al personal autorizado del club.
            </p>
            <h2 className="text-lg font-semibold text-foreground">Derechos del titular</h2>
            <p>
              Conforme a la Ley 25.326, usted tiene derecho a acceder, rectificar y suprimir sus datos
              personales. Para ejercer estos derechos, contacte a{' '}
              <a href={`mailto:${config?.email_contacto || 'contacto@club.com'}`} className="text-brand-500 hover:underline">
                {config?.email_contacto || 'contacto@club.com'}
              </a>.
            </p>
            <h2 className="text-lg font-semibold text-foreground">Datos de menores</h2>
            <p>
              No recopilamos datos de menores de 18 años sin el consentimiento de su padre, madre o
              tutor legal. El adulto responsable puede solicitar la eliminación de los datos del menor
              en cualquier momento.
            </p>
            <h2 className="text-lg font-semibold text-foreground">Cookies</h2>
            <p>
              Este sitio utiliza cookies técnicas necesarias para su funcionamiento (autenticación y
              preferencias de tema). No utilizamos cookies de seguimiento ni publicidad.
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
