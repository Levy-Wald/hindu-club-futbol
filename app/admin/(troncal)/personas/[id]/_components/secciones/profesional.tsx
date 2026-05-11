import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, type SeccionProps } from './shared'

export function SeccionProfesional({ s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Profesional</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Profesión / Ocupación">
            <Input value={s('profesion_ocupacion')} onChange={(e) => update('profesion_ocupacion', e.target.value)} placeholder="Ej: Contador, Ingeniero..." />
          </Field>
          <Field label="Categoría profesional">
            <Select value={s('categoria_profesional')} onValueChange={(v) => update('categoria_profesional', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="autonomo">Autónomo</SelectItem>
                <SelectItem value="empresario">Empresario</SelectItem>
                <SelectItem value="profesional_independiente">Profesional independiente</SelectItem>
                <SelectItem value="jubilado">Jubilado</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="ama_de_casa">Ama de casa</SelectItem>
                <SelectItem value="sin_actividad">Sin actividad</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Empresa actual">
            <Input value={s('empresa_actual')} onChange={(e) => update('empresa_actual', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Cargo">
            <Input value={s('cargo_actual')} onChange={(e) => update('cargo_actual', e.target.value)} />
          </Field>
          <Field label="Industria">
            <Input value={s('industria')} onChange={(e) => update('industria', e.target.value)} placeholder="Ej: Tecnología, Salud..." />
          </Field>
          <Field label="Sitio web profesional">
            <Input type="url" value={s('sitio_web_profesional')} onChange={(e) => update('sitio_web_profesional', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
