import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, type SeccionProps } from './shared'

export function SeccionMembresia({ form, s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Membresía club</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Primera relación con el club">
            <Input type="date" value={s('fecha_primera_relacion_club')} onChange={(e) => update('fecha_primera_relacion_club', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="es_socio_fundador" checked={form.es_socio_fundador ?? false} onCheckedChange={(v) => update('es_socio_fundador', v === true)} />
            <Label htmlFor="es_socio_fundador" className="cursor-pointer text-sm">Fundador</Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="es_socio_vitalicio" checked={form.es_socio_vitalicio ?? false} onCheckedChange={(v) => update('es_socio_vitalicio', v === true)} />
            <Label htmlFor="es_socio_vitalicio" className="cursor-pointer text-sm">Vitalicio</Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="es_socio_honorario" checked={form.es_socio_honorario ?? false} onCheckedChange={(v) => update('es_socio_honorario', v === true)} />
            <Label htmlFor="es_socio_honorario" className="cursor-pointer text-sm">Honorario</Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox id="bautizo_club_realizado" checked={form.bautizo_club_realizado ?? false} onCheckedChange={(v) => update('bautizo_club_realizado', v === true)} />
            <Label htmlFor="bautizo_club_realizado" className="cursor-pointer text-sm">Bautizo</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
