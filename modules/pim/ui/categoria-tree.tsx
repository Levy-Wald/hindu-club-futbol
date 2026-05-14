'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { CategoriaFormDialog } from './categoria-form'
import { eliminarCategoriaAction } from '../lib/actions'
import type { CategoriaConHijos, ProductoCategoria } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface CategoriaTreeProps {
  tree: CategoriaConHijos[]
  allCategorias: ProductoCategoria[]
}

export function CategoriaTree({ tree, allCategorias }: CategoriaTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <p>No hay categorias creadas.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg divide-y">
      {tree.map((node) => (
        <CategoriaNode key={node.id} node={node} allCategorias={allCategorias} depth={0} />
      ))}
    </div>
  )
}

function CategoriaNode({
  node,
  allCategorias,
  depth,
}: {
  node: CategoriaConHijos
  allCategorias: ProductoCategoria[]
  depth: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const hasChildren = node.children.length > 0

  function handleDelete() {
    if (!confirm(`Eliminar categoria "${node.nombre}"?`)) return
    startTransition(async () => {
      await eliminarCategoriaAction({ id: node.id })
      router.refresh()
    })
  }

  return (
    <div data-testid={`categoria-tree-node-${node.slug}`}>
      <div
        className="flex items-center justify-between p-3 hover:bg-muted/50"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5 text-center text-muted-foreground text-xs">-</span>
          )}
          <span className="text-sm font-medium">{node.nombre}</span>
          <span className="text-xs text-muted-foreground">({node.slug})</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CategoriaFormDialog
            mode="edit"
            categoria={node}
            categorias={allCategorias}
            triggerRender={<Button variant="ghost" size="sm" />}
            triggerLabel="Editar"
          />
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoriaNode key={child.id} node={child} allCategorias={allCategorias} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
