'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Circle, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CuentaNode {
  id: string
  codigo: string
  nombre: string
  tipo: string
  nivel: number
  es_imputable: boolean
  activa: boolean
  children: CuentaNode[]
}

const tipoColors: Record<string, string> = {
  activo: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
  pasivo: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
  patrimonio_neto: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ingreso: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  egreso: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
}

const tipoLabels: Record<string, string> = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  patrimonio_neto: 'Patrimonio Neto',
  ingreso: 'Ingreso',
  egreso: 'Egreso',
}

function TreeNode({ node, level = 0 }: { node: CuentaNode; level?: number }) {
  const [expanded, setExpanded] = useState(node.nivel <= 2)
  const hasChildren = node.children.length > 0
  const isRubro = node.nivel === 1

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group',
          !node.activa && 'opacity-50'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Expand/collapse or leaf indicator */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-muted"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="flex-shrink-0 w-5 flex items-center justify-center">
            {node.es_imputable && (
              <Circle className="h-2 w-2 fill-current text-muted-foreground" />
            )}
          </span>
        )}

        {/* Codigo */}
        <span
          className={cn(
            'font-mono text-sm text-muted-foreground flex-shrink-0',
            isRubro && 'font-semibold'
          )}
        >
          {node.codigo}
        </span>

        {/* Nombre */}
        <span
          className={cn(
            'text-sm truncate',
            isRubro && 'font-bold text-base',
            node.nivel === 2 && 'font-semibold'
          )}
        >
          {node.nombre}
        </span>

        {/* Tipo badge */}
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0',
            tipoColors[node.tipo] ?? 'bg-neutral-100 text-neutral-800'
          )}
        >
          {tipoLabels[node.tipo] ?? node.tipo}
        </span>

        {/* Imputable indicator */}
        {node.es_imputable && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:inline">
            imputable
          </span>
        )}

        {/* Inactive indicator */}
        {!node.activa && (
          <span className="text-[10px] text-destructive flex-shrink-0">
            inactiva
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlanCuentasTree({ tree }: { tree: CuentaNode[] }) {
  const [expandAll, setExpandAll] = useState(false)

  // We use a key trick to force re-render when toggling expand all
  const [treeKey, setTreeKey] = useState(0)

  const handleToggleAll = () => {
    setExpandAll(!expandAll)
    setTreeKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(tipoColors).map(([tipo, color]) => (
              <span
                key={tipo}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  color
                )}
              >
                {tipoLabels[tipo]}
              </span>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleToggleAll}>
          {expandAll ? 'Colapsar todo' : 'Expandir todo'}
        </Button>
      </div>

      {/* Tree */}
      <div className="border rounded-lg p-2" key={treeKey}>
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No hay cuentas en el plan de cuentas.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea la estructura contable para empezar.
            </p>
          </div>
        ) : (
          tree.map((node) => (
            <ExpandableTreeNode
              key={node.id}
              node={node}
              level={0}
              forceExpand={expandAll}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Separate component that respects forceExpand
function ExpandableTreeNode({
  node,
  level = 0,
  forceExpand,
}: {
  node: CuentaNode
  level?: number
  forceExpand: boolean
}) {
  const defaultExpanded = forceExpand || node.nivel <= 2
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasChildren = node.children.length > 0
  const isRubro = node.nivel === 1

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group',
          !node.activa && 'opacity-50'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-muted"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="flex-shrink-0 w-5 flex items-center justify-center">
            {node.es_imputable && (
              <Circle className="h-2 w-2 fill-current text-muted-foreground" />
            )}
          </span>
        )}

        <span
          className={cn(
            'font-mono text-sm text-muted-foreground flex-shrink-0',
            isRubro && 'font-semibold'
          )}
        >
          {node.codigo}
        </span>

        <span
          className={cn(
            'text-sm truncate',
            isRubro && 'font-bold text-base',
            node.nivel === 2 && 'font-semibold'
          )}
        >
          {node.nombre}
        </span>

        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0',
            tipoColors[node.tipo] ?? 'bg-neutral-100 text-neutral-800'
          )}
        >
          {tipoLabels[node.tipo] ?? node.tipo}
        </span>

        {node.es_imputable && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:inline">
            imputable
          </span>
        )}

        {!node.activa && (
          <span className="text-[10px] text-destructive flex-shrink-0">
            inactiva
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ExpandableTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              forceExpand={forceExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}
