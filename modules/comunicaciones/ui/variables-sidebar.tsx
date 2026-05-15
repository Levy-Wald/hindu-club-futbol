'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Variable {
  slug: string
  descripcion: string
  contexto: string
  ejemplo: string | null
}

interface VariablesSidebarProps {
  variables: Variable[]
  onInsert: (slug: string) => void
}

const CONTEXTO_LABELS: Record<string, string> = {
  persona: 'Persona',
  entidad: 'Entidad',
  cuota: 'Cuota',
  evento: 'Evento',
  equipo: 'Equipo',
  tenant: 'Tenant',
  producto: 'Producto',
}

export function VariablesSidebar({ variables, onInsert }: VariablesSidebarProps) {
  const grouped = variables.reduce<Record<string, Variable[]>>((acc, v) => {
    const key = v.contexto
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Variables disponibles</CardTitle>
        <p className="text-[11px] text-muted-foreground">Click para insertar en el editor</p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
        {Object.entries(grouped).map(([contexto, vars]) => (
          <div key={contexto}>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {CONTEXTO_LABELS[contexto] ?? contexto}
            </p>
            <div className="flex flex-wrap gap-1">
              {vars.map((v) => (
                <Badge
                  key={v.slug}
                  variant="secondary"
                  className="cursor-pointer text-[10px] hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
                  onClick={() => onInsert(v.slug)}
                  title={`${v.descripcion}${v.ejemplo ? ` — Ej: ${v.ejemplo}` : ''}`}
                >
                  {`{{${v.slug}}}`}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        {variables.length === 0 && (
          <p className="text-xs text-muted-foreground">No hay variables disponibles</p>
        )}
      </CardContent>
    </Card>
  )
}
