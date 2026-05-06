import { PublicHeader } from './_components/public-header'
import { PublicFooter } from './_components/public-footer'
import { fetchConfigPublica } from './_lib/queries'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await fetchConfigPublica()

  const clubNombre = config?.nombre_display ?? 'Hindu Club Fútbol'
  const contactoEmail = config?.email_contacto ?? undefined
  const contactoTelefono = config?.telefono ?? undefined
  const whatsapp = config?.whatsapp ?? undefined
  const direccion = config?.direccion ?? undefined
  const redes = (config?.redes ?? {}) as Record<string, string>
  const logoUrl = config?.logo_url ?? '/hindu-logo.png'

  return (
    <>
      <PublicHeader clubNombre={clubNombre} logoUrl={logoUrl} />
      <main className="flex-1">{children}</main>
      <PublicFooter
        clubNombre={clubNombre}
        logoUrl={logoUrl}
        contactoEmail={contactoEmail}
        contactoTelefono={contactoTelefono}
        whatsapp={whatsapp}
        direccion={direccion}
        redes={redes}
      />
    </>
  )
}
