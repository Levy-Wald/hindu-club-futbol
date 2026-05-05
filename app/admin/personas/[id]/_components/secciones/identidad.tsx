import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, PAISES, type SeccionProps } from './shared'

export function SeccionIdentidad({ update, s }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Identidad</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nombre *">
            <Input value={s('nombre')} onChange={(e) => update('nombre', e.target.value)} required />
          </Field>
          <Field label="Apellido *">
            <Input value={s('apellido')} onChange={(e) => update('apellido', e.target.value)} required />
          </Field>
          <Field label="Nombre legal completo">
            <Input value={s('nombre_completo_legal')} onChange={(e) => update('nombre_completo_legal', e.target.value)} placeholder="Si difiere del nombre + apellido" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Tipo documento *">
            <Select value={s('tipo_documento')} onValueChange={(v) => update('tipo_documento', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="pasaporte">Pasaporte</SelectItem>
                <SelectItem value="cedula">Cédula</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nro. documento *">
            <Input value={s('numero_documento')} onChange={(e) => update('numero_documento', e.target.value)} required />
          </Field>
          <Field label="País emisión doc.">
            <Select value={s('dni_pais_emision') || 'AR'} onValueChange={(v) => update('dni_pais_emision', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="CUIL/CUIT">
            <Input value={s('cuil_cuit')} onChange={(e) => update('cuil_cuit', e.target.value)} placeholder="20-12345678-9" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Pasaporte nro.">
            <Input value={s('pasaporte_numero')} onChange={(e) => update('pasaporte_numero', e.target.value)} />
          </Field>
          <Field label="Pasaporte país">
            <Select value={s('pasaporte_pais') || ''} onValueChange={(v) => update('pasaporte_pais', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Pasaporte vigencia">
            <Input type="date" value={s('pasaporte_vigencia')} onChange={(e) => update('pasaporte_vigencia', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Fecha nacimiento">
            <Input type="date" value={s('fecha_nacimiento')} onChange={(e) => update('fecha_nacimiento', e.target.value)} />
          </Field>
          <Field label="Género">
            <Select value={s('genero')} onValueChange={(v) => update('genero', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="no_binario">No binario</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
                <SelectItem value="prefiere_no_decir">Prefiere no decir</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nacionalidad">
            <Select value={s('nacionalidad') || 'AR'} onValueChange={(v) => update('nacionalidad', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil">
            <Select value={s('estado_civil')} onValueChange={(v) => update('estado_civil', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soltero">Soltero/a</SelectItem>
                <SelectItem value="casado">Casado/a</SelectItem>
                <SelectItem value="divorciado">Divorciado/a</SelectItem>
                <SelectItem value="viudo">Viudo/a</SelectItem>
                <SelectItem value="en_pareja">En pareja</SelectItem>
                <SelectItem value="conviviente">Conviviente</SelectItem>
                <SelectItem value="separado">Separado/a</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
