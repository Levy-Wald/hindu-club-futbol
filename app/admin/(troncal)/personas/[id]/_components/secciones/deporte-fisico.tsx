import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, type SeccionProps } from './shared'

export function SeccionDeporteFisico({ form, s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Perfil físico</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Altura (cm)">
            <Input type="number" min={50} max={250} value={form.altura_cm ?? ''} onChange={(e) => update('altura_cm', e.target.valueAsNumber || 0)} placeholder="175" />
          </Field>
          <Field label="Peso (kg)">
            <Input type="number" min={20} max={300} step="0.1" value={form.peso_kg ?? ''} onChange={(e) => update('peso_kg', e.target.valueAsNumber || 0)} placeholder="72.5" />
          </Field>
          <Field label="Fecha medición">
            <Input type="date" value={s('fecha_medicion_fisica')} onChange={(e) => update('fecha_medicion_fisica', e.target.value)} />
          </Field>
          <Field label="Contextura">
            <Select value={s('contextura')} onValueChange={(v) => update('contextura', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pequeña">Pequeña</SelectItem>
                <SelectItem value="mediana">Mediana</SelectItem>
                <SelectItem value="grande">Grande</SelectItem>
                <SelectItem value="atletica">Atlética</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Lateralidad">
            <Select value={s('lateralidad')} onValueChange={(v) => update('lateralidad', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zurdo">Zurdo</SelectItem>
                <SelectItem value="derecho">Derecho</SelectItem>
                <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pie dominante">
            <Select value={s('pie_dominante')} onValueChange={(v) => update('pie_dominante', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="izquierdo">Izquierdo</SelectItem>
                <SelectItem value="derecho">Derecho</SelectItem>
                <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mano dominante">
            <Select value={s('mano_dominante')} onValueChange={(v) => update('mano_dominante', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="izquierda">Izquierda</SelectItem>
                <SelectItem value="derecha">Derecha</SelectItem>
                <SelectItem value="ambidiestra">Ambidiestra</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo pisada">
            <Select value={s('tipo_pisada')} onValueChange={(v) => update('tipo_pisada', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pronador">Pronador</SelectItem>
                <SelectItem value="supinador">Supinador</SelectItem>
                <SelectItem value="neutro">Neutro</SelectItem>
                <SelectItem value="desconocido">Desconocido</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="usa_lentes" checked={form.usa_lentes ?? false} onCheckedChange={(v) => update('usa_lentes', v === true)} />
            <Label htmlFor="usa_lentes" className="cursor-pointer text-sm">Usa lentes</Label>
          </div>
          <Field label="Tipo lentes">
            <Select value={s('tipo_lentes')} onValueChange={(v) => update('tipo_lentes', v)} disabled={!form.usa_lentes}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recetados">Recetados</SelectItem>
                <SelectItem value="contacto">De contacto</SelectItem>
                <SelectItem value="deportivos">Deportivos</SelectItem>
                <SelectItem value="sol_recetados">Sol con receta</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="usa_audifono" checked={form.usa_audifono ?? false} onCheckedChange={(v) => update('usa_audifono', v === true)} />
            <Label htmlFor="usa_audifono" className="cursor-pointer text-sm">Usa audífono</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
