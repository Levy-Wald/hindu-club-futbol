'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Trash2 } from 'lucide-react'
import {
  eliminarListaPreciosAction,
  establecerListaDefaultAction,
} from '../lib/actions'
import { ListaPreciosFormDialog } from './lista-precios-form'
import type { ListaPrecios, TipoLista } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const TIPO_COLORS: Record<TipoLista, string> = {
  compra: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  costo: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  venta: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

interface ListaPreciosRowProps {
  lista: ListaPrecios
}

export function ListaPreciosRow({ lista }: ListaPreciosRowProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`Eliminar la lista "${lista.nombre}"?`)) return
    startTransition(async () => {
      await eliminarListaPreciosAction({ id: lista.id })
      router.refresh()
    })
  }

  function handleSetDefault() {
    startTransition(async () => {
      await establecerListaDefaultAction({ id: lista.id, tipo: lista.tipo })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{lista.nombre}</span>
          <Badge className={`text-xs ${TIPO_COLORS[lista.tipo]}`}>
            {lista.tipo}
          </Badge>
          <Badge variant="outline" className="text-xs">{lista.moneda}</Badge>
          {lista.es_default && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-0.5" />
              Default
            </Badge>
          )}
          {!lista.activa && <Badge variant="secondary" className="text-xs">Inactiva</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>slug: {lista.slug}</span>
          {lista.descripcion && <span className="truncate max-w-[300px]">· {lista.descripcion}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!lista.es_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSetDefault}
            disabled={isPending}
            title="Marcar como default"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <ListaPreciosFormDialog
          mode="edit"
          lista={lista}
          triggerRender={<Button variant="ghost" size="sm" />}
          triggerLabel="Editar"
        />
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
