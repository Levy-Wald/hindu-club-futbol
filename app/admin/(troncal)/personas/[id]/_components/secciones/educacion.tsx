import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, IDIOMAS, type SeccionProps } from './shared'

export function SeccionEducacion({ form, s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Educación</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Nivel educativo máximo">
            <Select value={s('nivel_educativo_max')} onValueChange={(v) => update('nivel_educativo_max', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primaria_incompleta">Primaria incompleta</SelectItem>
                <SelectItem value="primaria">Primaria completa</SelectItem>
                <SelectItem value="secundaria_incompleta">Secundaria incompleta</SelectItem>
                <SelectItem value="secundaria">Secundaria completa</SelectItem>
                <SelectItem value="terciario_incompleto">Terciario incompleto</SelectItem>
                <SelectItem value="terciario">Terciario completo</SelectItem>
                <SelectItem value="universitario_incompleto">Universitario incompleto</SelectItem>
                <SelectItem value="universitario">Universitario completo</SelectItem>
                <SelectItem value="posgrado">Posgrado</SelectItem>
                <SelectItem value="doctorado">Doctorado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Título / Carrera">
            <Input value={s('titulo_carrera')} onChange={(e) => update('titulo_carrera', e.target.value)} placeholder="Ej: Lic. en Administración" />
          </Field>
          <Field label="Institución">
            <Input value={s('institucion_titulo')} onChange={(e) => update('institucion_titulo', e.target.value)} placeholder="Ej: UBA, ITBA..." />
          </Field>
          <Field label="Año graduación">
            <Input type="number" min={1950} max={2030} value={form.año_graduacion ?? ''} onChange={(e) => update('año_graduacion', e.target.valueAsNumber || 0)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="estudiando_actualmente" checked={form.estudiando_actualmente ?? false} onCheckedChange={(v) => update('estudiando_actualmente', v === true)} />
            <Label htmlFor="estudiando_actualmente" className="cursor-pointer text-sm">Estudia actualmente</Label>
          </div>
          <Field label="Institución actual">
            <Input value={s('institucion_actual')} onChange={(e) => update('institucion_actual', e.target.value)} disabled={!form.estudiando_actualmente} />
          </Field>
          <Field label="Año/grado cursando">
            <Input value={s('año_grado_actual')} onChange={(e) => update('año_grado_actual', e.target.value)} disabled={!form.estudiando_actualmente} placeholder="Ej: 3er año" />
          </Field>
          <Field label="Idioma nativo">
            <Select value={s('idioma_nativo') || 'es'} onValueChange={(v) => update('idioma_nativo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{IDIOMAS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
