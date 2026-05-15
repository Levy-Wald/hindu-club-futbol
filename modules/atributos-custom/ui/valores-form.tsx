'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'
import { guardarValoresBatch } from '../lib/actions'
import type { AtributoDefinicion, AtributoValor, AplicaA } from '../lib/tipos'

interface ValoresFormProps {
  definiciones: AtributoDefinicion[]
  valoresExistentes: AtributoValor[]
  entidadTipo: AplicaA
  entidadId: string
}

export function ValoresForm({ definiciones, valoresExistentes, entidadTipo, entidadId }: ValoresFormProps) {
  const [loading, setLoading] = useState(false)

  // Build initial values map
  const buildValuesMap = useCallback(() => {
    const map = new Map<string, { valor: string | null; valor_jsonb: unknown | null }>()
    for (const v of valoresExistentes) {
      map.set(v.definicion_id, { valor: v.valor, valor_jsonb: v.valor_jsonb })
    }
    return map
  }, [valoresExistentes])

  const [valuesMap, setValuesMap] = useState(() => buildValuesMap())

  function getValue(defId: string): string {
    return valuesMap.get(defId)?.valor ?? ''
  }

  function getJsonbValue(defId: string): string[] {
    const v = valuesMap.get(defId)?.valor_jsonb
    if (Array.isArray(v)) return v as string[]
    return []
  }

  function setValue(defId: string, valor: string | null, valor_jsonb?: unknown | null) {
    setValuesMap(prev => {
      const next = new Map(prev)
      next.set(defId, { valor, valor_jsonb: valor_jsonb ?? null })
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    const valores = definiciones.map(def => ({
      definicion_id: def.id,
      valor: valuesMap.get(def.id)?.valor ?? null,
      valor_jsonb: valuesMap.get(def.id)?.valor_jsonb ?? null,
    }))

    const result = await guardarValoresBatch(entidadTipo, entidadId, valores)
    setLoading(false)

    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  if (definiciones.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay atributos custom definidos para este tipo de entidad.
          <br />
          <span className="text-sm">Configurá atributos en Configuración → Atributos custom.</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Atributos custom</CardTitle>
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
          Guardar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {definiciones.map(def => (
            <div key={def.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>{def.nombre}</Label>
                {def.obligatorio && <Badge variant="destructive" className="text-[10px] h-4">Requerido</Badge>}
              </div>
              {def.descripcion && (
                <p className="text-xs text-muted-foreground">{def.descripcion}</p>
              )}
              <ValorInput
                def={def}
                valor={getValue(def.id)}
                valorJsonb={getJsonbValue(def.id)}
                onChange={(v, j) => setValue(def.id, v, j)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ValorInput({
  def,
  valor,
  valorJsonb,
  onChange,
}: {
  def: AtributoDefinicion
  valor: string
  valorJsonb: string[]
  onChange: (valor: string | null, valorJsonb?: unknown | null) => void
}) {
  const opciones = (def.opciones as string[] | null) ?? []

  switch (def.tipo_dato) {
    case 'texto':
      return (
        <Input
          value={valor}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={def.valor_default ?? ''}
        />
      )

    case 'numero':
      return (
        <Input
          type="number"
          value={valor}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={def.valor_default ?? ''}
        />
      )

    case 'fecha':
      return (
        <Input
          type="date"
          value={valor}
          onChange={(e) => onChange(e.target.value || null)}
        />
      )

    case 'booleano':
      return (
        <Switch
          checked={valor === 'true'}
          onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
        />
      )

    case 'select':
      return (
        <Select value={valor} onValueChange={(v) => onChange(v ?? null)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((op) => (
              <SelectItem key={op} value={op}>{op}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'multi_select':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {valorJsonb.map((op) => (
              <Badge key={op} variant="secondary" className="gap-1">
                {op}
                <button onClick={() => {
                  const next = valorJsonb.filter(v => v !== op)
                  onChange(null, next)
                }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Select
            value=""
            onValueChange={(v) => {
              if (v && !valorJsonb.includes(v)) {
                onChange(null, [...valorJsonb, v])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Agregar..." />
            </SelectTrigger>
            <SelectContent>
              {opciones
                .filter(op => !valorJsonb.includes(op))
                .map((op) => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )

    default:
      return <Input value={valor} onChange={(e) => onChange(e.target.value || null)} />
  }
}
