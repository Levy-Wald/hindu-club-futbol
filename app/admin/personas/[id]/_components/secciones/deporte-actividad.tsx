import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, DEPORTES, type SeccionProps } from './shared'

export function SeccionDeporteActividad({ form, s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Actividad deportiva</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Deporte principal">
            <Select value={s('deporte_principal_slug')} onValueChange={(v) => update('deporte_principal_slug', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{DEPORTES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Años de práctica">
            <Input type="number" min={0} max={60} value={form.años_practica_deporte_principal ?? ''} onChange={(e) => update('años_practica_deporte_principal', e.target.valueAsNumber || 0)} />
          </Field>
          <Field label="Categoría histórica máx.">
            <Select value={s('categoria_historica_max')} onValueChange={(v) => update('categoria_historica_max', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recreativo">Recreativo</SelectItem>
                <SelectItem value="federado">Federado</SelectItem>
                <SelectItem value="profesional">Profesional</SelectItem>
                <SelectItem value="seleccion">Selección</SelectItem>
                <SelectItem value="olimpico">Olímpico</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nivel actividad actual">
            <Select value={s('nivel_actividad_actual')} onValueChange={(v) => update('nivel_actividad_actual', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentario</SelectItem>
                <SelectItem value="ligero">Ligero</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="atleta">Atleta</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Entrenamientos por semana">
            <Input type="number" min={0} max={14} value={form.frecuencia_entrenamiento_semanal ?? ''} onChange={(e) => update('frecuencia_entrenamiento_semanal', e.target.valueAsNumber || 0)} />
          </Field>
          <Field label="Horas por semana">
            <Input type="number" min={0} max={50} step="0.5" value={form.horas_entrenamiento_semanales ?? ''} onChange={(e) => update('horas_entrenamiento_semanales', e.target.valueAsNumber || 0)} />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
