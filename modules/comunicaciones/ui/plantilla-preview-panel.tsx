'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Mail, Bell } from 'lucide-react'
import { renderTemplate } from '@/modules/comunicaciones/lib/renderer'
import { getVariablesEjemploCompleto } from '@/modules/comunicaciones/lib/plantillas/ejemplos'

interface PlantillaPreviewPanelProps {
  tipo: string
  asunto: string
  cuerpo: string
  variables: string[]
}

export function PlantillaPreviewPanel({ tipo, asunto, cuerpo, variables }: PlantillaPreviewPanelProps) {
  const [conEjemplos, setConEjemplos] = useState(true)

  const vars = conEjemplos
    ? getVariablesEjemploCompleto(variables)
    : Object.fromEntries(variables.map(v => [v, `{{${v}}}`]))

  const asuntoRenderizado = asunto ? renderTemplate(asunto, vars) : ''
  const cuerpoRenderizado = renderTemplate(cuerpo, vars)

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Vista previa</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="preview-toggle" className="text-xs text-muted-foreground">
              Ejemplos
            </Label>
            <Switch
              id="preview-toggle"
              size="sm"
              checked={conEjemplos}
              onCheckedChange={setConEjemplos}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tipo === 'email' ? (
          <div className="rounded-md border bg-muted/20 p-3 space-y-2">
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <p><span className="font-medium">De:</span> noreply@levywald.com</p>
              <p><span className="font-medium">Para:</span> {conEjemplos ? 'juan.perez@ejemplo.com' : '{{email}}'}</p>
              {asuntoRenderizado && (
                <p><span className="font-medium">Asunto:</span> {asuntoRenderizado}</p>
              )}
            </div>
            <hr className="border-border/50" />
            <p className="text-sm whitespace-pre-wrap">{cuerpoRenderizado || '(sin contenido)'}</p>
          </div>
        ) : (
          <div className="rounded-md border bg-muted/20 p-3 flex items-start gap-2">
            <Bell className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
            <p className="text-sm whitespace-pre-wrap">{cuerpoRenderizado || '(sin contenido)'}</p>
          </div>
        )}

        {variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <p className="text-[11px] text-muted-foreground mr-1">Variables:</p>
            {variables.map(v => (
              <Badge key={v} variant="secondary" className="text-[10px]">
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
