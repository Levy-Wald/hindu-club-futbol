import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, type SeccionProps } from './shared'

export function SeccionContacto({ s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email principal">
            <Input type="email" value={s('email_principal')} onChange={(e) => update('email_principal', e.target.value)} placeholder="nombre@ejemplo.com" />
          </Field>
          <Field label="Email secundario">
            <Input type="email" value={s('email_secundario')} onChange={(e) => update('email_secundario', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Teléfono principal">
            <Input type="tel" value={s('telefono_principal')} onChange={(e) => update('telefono_principal', e.target.value)} placeholder="+54 11 1234-5678" />
          </Field>
          <Field label="Teléfono secundario">
            <Input type="tel" value={s('telefono_secundario')} onChange={(e) => update('telefono_secundario', e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input type="tel" value={s('whatsapp')} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+54 11 1234-5678" />
          </Field>
          <Field label="WhatsApp emergencia">
            <Input type="tel" value={s('whatsapp_emergencia')} onChange={(e) => update('whatsapp_emergencia', e.target.value)} />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
