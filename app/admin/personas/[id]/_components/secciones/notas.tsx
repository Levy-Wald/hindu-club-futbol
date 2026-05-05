import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SeccionProps } from './shared'

export function SeccionNotas({ s, update }: SeccionProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
      <CardContent>
        <Textarea
          value={s('notas_internas')}
          onChange={(e) => update('notas_internas', e.target.value)}
          rows={6}
          placeholder="Notas visibles solo para administradores del sistema..."
        />
      </CardContent>
    </Card>
  )
}
