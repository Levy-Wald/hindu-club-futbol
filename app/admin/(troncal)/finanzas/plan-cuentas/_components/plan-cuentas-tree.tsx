'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Circle, Pencil, Plus, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { desactivarCuenta, reactivarCuenta } from '@/modules/finanzas/lib/actions'
import { CuentaFormDialog } from './cuenta-form-dialog'

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

interface AllCuenta {
  id: string
  codigo: string
  nombre: string
  tipo: string
  nivel: number
}

export function PlanCuentasTree({ tree, allCuentas }: { tree: CuentaNode[]; allCuentas: AllCuenta[] }) {
  const [expandAll, setExpandAll] = useState(false)
  const [treeKey, setTreeKey] = useState(0)

  const handleToggleAll = () => {
    setExpandAll(!expandAll)
    setTreeKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <Button variant="outline" size="sm" onClick={handleToggleAll}>
          {expandAll ? 'Colapsar todo' : 'Expandir todo'}
        </Button>
      </div>

      <div className="border rounded-lg p-2" key={treeKey}>
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No hay cuentas en el plan de cuentas.</p>
            <p className="text-sm text-muted-foreground mt-1">Crea la estructura contable para empezar.</p>
          </div>
        ) : (
          tree.map((node) => (
            <ExpandableTreeNode
              key={node.id}
              node={node}
              level={0}
              forceExpand={expandAll}
              allCuentas={allCuentas}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ExpandableTreeNode({
  node,
  level = 0,
  forceExpand,
  allCuentas,
}: {
  node: CuentaNode
  level?: number
  forceExpand: boolean
  allCuentas: AllCuenta[]
}) {
  const defaultExpanded = forceExpand || node.nivel <= 2
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [pending, startTransition] = useTransition()
  const hasChildren = node.children.length > 0
  const isRubro = node.nivel === 1

  function handleToggleActiva() {
    startTransition(async () => {
      if (node.activa) {
        const res = await desactivarCuenta(node.id)
        if (res.success) toast.success('Cuenta desactivada')
        else toast.error(res.error)
      } else {
        const res = await reactivarCuenta(node.id)
        if (res.success) toast.success('Cuenta reactivada')
        else toast.error(res.error)
      }
    })
  }

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
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
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
            {node.es_imputable && <Circle className="h-2 w-2 fill-current text-muted-foreground" />}
          </span>
        )}

        <span className={cn('font-mono text-sm text-muted-foreground flex-shrink-0', isRubro && 'font-semibold')}>
          {node.codigo}
        </span>

        <span className={cn('text-sm truncate', isRubro && 'font-bold text-base', node.nivel === 2 && 'font-semibold')}>
          {node.nombre}
        </span>

        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0',
          tipoColors[node.tipo] ?? 'bg-neutral-100 text-neutral-800'
        )}>
          {tipoLabels[node.tipo] ?? node.tipo}
        </span>

        {node.es_imputable && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:inline">imputable</span>
        )}

        {!node.activa && (
          <span className="text-[10px] text-destructive flex-shrink-0">inactiva</span>
        )}

        {/* Hover actions */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <CuentaFormDialog
            trigger={<Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Pencil className="h-3 w-3" /></Button>}
            cuenta={node}
            allCuentas={allCuentas}
          />
          <CuentaFormDialog
            trigger={<Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Plus className="h-3 w-3" /></Button>}
            parentCuenta={node}
            allCuentas={allCuentas}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleToggleActiva}
            disabled={pending}
            title={node.activa ? 'Desactivar' : 'Reactivar'}
          >
            <Power className={cn('h-3 w-3', node.activa ? 'text-muted-foreground' : 'text-success-600')} />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ExpandableTreeNode key={child.id} node={child} level={level + 1} forceExpand={forceExpand} allCuentas={allCuentas} />
          ))}
        </div>
      )}
    </div>
  )
}
