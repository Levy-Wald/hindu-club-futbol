'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { DefinicionForm } from '@/modules/atributos-custom/ui/definicion-form'
import { softDeleteDefinicion } from '@/modules/atributos-custom/lib/actions'
import type { AtributoDefinicion, AplicaA } from '@/modules/atributos-custom/lib/tipos'
import { TIPO_DATO_LABELS, APLICA_A_LABELS } from '@/modules/atributos-custom/lib/tipos'

interface Props {
  definiciones: AtributoDefinicion[]
}

export function AtributosCustomConfig({ definiciones }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AtributoDefinicion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AtributoDefinicion | null>(null)
  const [filtroAplicaA, setFiltroAplicaA] = useState<AplicaA | 'todos'>('todos')

  const filtered = filtroAplicaA === 'todos'
    ? definiciones
    : definiciones.filter(d => d.aplica_a === filtroAplicaA)

  // Group by aplica_a
  const grouped = new Map<AplicaA, AtributoDefinicion[]>()
  for (const d of filtered) {
    const list = grouped.get(d.aplica_a) ?? []
    list.push(d)
    grouped.set(d.aplica_a, list)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await softDeleteDefinicion(deleteTarget.id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva definición
        </Button>
        <Select
          value={filtroAplicaA}
          onValueChange={(v) => setFiltroAplicaA((v ?? 'todos') as AplicaA | 'todos')}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {(Object.keys(APLICA_A_LABELS) as AplicaA[]).map((k) => (
              <SelectItem key={k} value={k}>{APLICA_A_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay definiciones de atributos custom.
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([aplicaA, defs]) => (
          <Card key={aplicaA}>
            <CardHeader>
              <CardTitle className="text-lg">{APLICA_A_LABELS[aplicaA]} ({defs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {defs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{d.nombre}</div>
                        <div className="text-xs text-muted-foreground">{d.slug}</div>
                      </div>
                      <Badge variant="outline">{TIPO_DATO_LABELS[d.tipo_dato]}</Badge>
                      {d.obligatorio && <Badge variant="destructive" className="text-[10px]">Requerido</Badge>}
                      {d.visible_en_listado && <Badge variant="secondary" className="text-[10px]">Listado</Badge>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditing(d); setFormOpen(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <DefinicionForm
        definicion={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar definición</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleteTarget?.nombre}&quot;. Los valores asignados a entidades se conservarán pero no serán visibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
