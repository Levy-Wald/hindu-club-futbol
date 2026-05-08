import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Field, DEPORTES, type SeccionProps } from './shared'

export function SeccionDeporteActividad({ form, s, update }: SeccionProps) {
  const principal = s('deporte_principal_slug')
  const secundarios = form.deportes_secundarios ?? []
  const opcionesSecundarios = DEPORTES.filter((d) => d.value !== principal)

  function agregarSecundario(slug: string | null) {
    if (!slug || secundarios.includes(slug)) return
    update('deportes_secundarios', [...secundarios, slug])
  }

  function quitarSecundario(slug: string) {
    update('deportes_secundarios', secundarios.filter((s) => s !== slug))
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Actividad deportiva</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Deporte principal">
            <Select value={s('deporte_principal_slug')} onValueChange={(v) => {
              update('deporte_principal_slug', v)
              // Si el nuevo principal estaba en secundarios, quitarlo
              if (secundarios.includes(v ?? '')) {
                update('deportes_secundarios', secundarios.filter((s) => s !== v))
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{DEPORTES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Deportes secundarios">
            <Select value="" onValueChange={agregarSecundario}>
              <SelectTrigger><SelectValue placeholder="Agregar deporte..." /></SelectTrigger>
              <SelectContent>
                {opcionesSecundarios
                  .filter((d) => !secundarios.includes(d.value))
                  .map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {secundarios.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {secundarios.map((slug) => {
                  const label = DEPORTES.find((d) => d.value === slug)?.label ?? slug
                  return (
                    <Badge key={slug} variant="secondary" className="gap-1 pr-1">
                      {label}
                      <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => quitarSecundario(slug)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            )}
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
