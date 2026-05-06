import Link from 'next/link'
import Image from 'next/image'

interface PublicFooterProps {
  clubNombre: string
  logoUrl: string
  contactoEmail?: string
  contactoTelefono?: string
  whatsapp?: string
  direccion?: string
  redes: Record<string, string>
}

export function PublicFooter({
  clubNombre,
  logoUrl,
  contactoEmail,
  contactoTelefono,
  whatsapp,
  direccion,
  redes,
}: PublicFooterProps) {
  const anioActual = new Date().getFullYear()

  const redesItems = [
    { key: 'instagram', label: 'IG', prefix: 'https://instagram.com/' },
    { key: 'facebook', label: 'FB', prefix: 'https://facebook.com/' },
    { key: 'twitter', label: 'X', prefix: 'https://x.com/' },
    { key: 'youtube', label: 'YT', prefix: 'https://youtube.com/' },
    { key: 'tiktok', label: 'TK', prefix: 'https://tiktok.com/@' },
  ]

  return (
    <footer className="border-t border-white/10 bg-[#1E3A5F] text-gray-300 dark:bg-[#0C1D2C]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Sobre el club */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Sobre el club
            </h3>
            <p className="text-sm leading-relaxed">
              {clubNombre} — Pasión por el fútbol desde siempre.
              Formando jugadores y construyendo comunidad.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Links
            </h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm transition-colors hover:text-white">Inicio</Link></li>
              <li><Link href="/equipos" className="text-sm transition-colors hover:text-white">Equipos</Link></li>
              <li><Link href="/asociate" className="text-sm transition-colors hover:text-white">Inscribite</Link></li>
              <li><Link href="/terminos" className="text-sm transition-colors hover:text-white">Términos</Link></li>
              <li><Link href="/privacidad" className="text-sm transition-colors hover:text-white">Privacidad</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm">
              {contactoEmail && (
                <li>
                  <a href={`mailto:${contactoEmail}`} className="transition-colors hover:text-white">
                    {contactoEmail}
                  </a>
                </li>
              )}
              {contactoTelefono && (
                <li>
                  <a href={`tel:${contactoTelefono}`} className="transition-colors hover:text-white">
                    {contactoTelefono}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    WhatsApp: {whatsapp}
                  </a>
                </li>
              )}
              {direccion && <li>{direccion}</li>}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Seguinos
            </h3>
            <div className="flex flex-wrap gap-3">
              {redesItems.map(({ key, label, prefix }) => {
                const value = redes[key]
                if (!value) return null
                const url = value.startsWith('http') ? value : `${prefix}${value}`
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium transition-colors hover:bg-white/20 hover:text-white"
                    aria-label={key}
                  >
                    {label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src={logoUrl} alt={clubNombre} width={24} height={24} className="h-6 w-6 opacity-70" />
              <span className="text-xs text-gray-400">
                &copy; {anioActual} {clubNombre}. Todos los derechos reservados.
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/terminos" className="text-xs text-gray-400 transition-colors hover:text-white">
                Términos
              </Link>
              <Link href="/privacidad" className="text-xs text-gray-400 transition-colors hover:text-white">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
