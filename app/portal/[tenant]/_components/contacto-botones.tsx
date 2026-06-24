import { MessageCircle, Phone, Mail } from 'lucide-react'

// Botones de contacto reutilizables (WhatsApp / llamar / mail). "Mensaje" = WhatsApp
// hasta que exista mensajería interna (F5). Acepta números con cualquier formato.
function soloDigitos(s: string | null | undefined): string | null {
  if (!s) return null
  const d = s.replace(/\D/g, '')
  return d.length >= 8 ? d : null
}

export function ContactoBotones({
  whatsapp,
  telefono,
  email,
  mensajeWhatsapp,
  size = 'sm',
}: {
  whatsapp?: string | null
  telefono?: string | null
  email?: string | null
  mensajeWhatsapp?: string
  size?: 'sm' | 'md'
}) {
  const wa = soloDigitos(whatsapp ?? telefono)
  const tel = soloDigitos(telefono ?? whatsapp)
  const dim = size === 'md' ? 'h-10 w-10' : 'h-8 w-8'
  const icon = size === 'md' ? 'h-4.5 w-4.5' : 'h-4 w-4'
  const waHref = wa
    ? `https://wa.me/${wa}${mensajeWhatsapp ? `?text=${encodeURIComponent(mensajeWhatsapp)}` : ''}`
    : null

  if (!wa && !tel && !email) {
    return <span className="text-xs text-muted-foreground">Sin contacto cargado</span>
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      {waHref && (
        <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Enviar mensaje por WhatsApp"
          className={`${dim} rounded-md border flex items-center justify-center text-primary hover:bg-accent`}>
          <MessageCircle className={icon} />
        </a>
      )}
      {tel && (
        <a href={`tel:${tel}`} aria-label="Llamar"
          className={`${dim} rounded-md border flex items-center justify-center text-muted-foreground hover:bg-accent`}>
          <Phone className={icon} />
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} aria-label="Enviar email"
          className={`${dim} rounded-md border flex items-center justify-center text-muted-foreground hover:bg-accent`}>
          <Mail className={icon} />
        </a>
      )}
    </div>
  )
}
