import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, PAISES, PROVINCIAS, type SeccionProps } from './shared'

export function SeccionDireccion({ s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Dirección</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field label="Calle" className="sm:col-span-3">
            <Input value={s('direccion_calle')} onChange={(e) => update('direccion_calle', e.target.value)} />
          </Field>
          <Field label="Número">
            <Input value={s('direccion_numero')} onChange={(e) => update('direccion_numero', e.target.value)} />
          </Field>
          <Field label="Piso">
            <Input value={s('direccion_piso')} onChange={(e) => update('direccion_piso', e.target.value)} />
          </Field>
          <Field label="Depto">
            <Input value={s('direccion_depto')} onChange={(e) => update('direccion_depto', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Barrio">
            <Input value={s('direccion_barrio')} onChange={(e) => update('direccion_barrio', e.target.value)} />
          </Field>
          <Field label="Ciudad">
            <Input value={s('direccion_ciudad')} onChange={(e) => update('direccion_ciudad', e.target.value)} />
          </Field>
          <Field label="Provincia">
            <Select value={s('direccion_provincia')} onValueChange={(v) => update('direccion_provincia', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{PROVINCIAS.map((prov) => <SelectItem key={prov} value={prov}>{prov}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Código postal">
            <Input value={s('direccion_codigo_postal')} onChange={(e) => update('direccion_codigo_postal', e.target.value)} placeholder="1234" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="País">
            <Select value={s('direccion_pais') || 'AR'} onValueChange={(v) => update('direccion_pais', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Observaciones">
            <Input value={s('direccion_observaciones')} onChange={(e) => update('direccion_observaciones', e.target.value)} placeholder="Ej: entre calles, referencia..." />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
