import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import {
  PlanCuentasTree,
  type CuentaNode,
} from './_components/plan-cuentas-tree'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

interface CuentaRow {
  id: string
  codigo: string
  nombre: string
  tipo: string
  cuenta_padre_id: string | null
  nivel: number
  es_imputable: boolean
  activa: boolean
}

function buildTree(cuentas: CuentaRow[]): CuentaNode[] {
  const nodeMap = new Map<string, CuentaNode>()
  const roots: CuentaNode[] = []

  // Crear nodos
  for (const cuenta of cuentas) {
    nodeMap.set(cuenta.id, {
      id: cuenta.id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      nivel: cuenta.nivel,
      es_imputable: cuenta.es_imputable,
      activa: cuenta.activa,
      children: [],
    })
  }

  // Armar arbol
  for (const cuenta of cuentas) {
    const node = nodeMap.get(cuenta.id)!
    if (cuenta.cuenta_padre_id && nodeMap.has(cuenta.cuenta_padre_id)) {
      nodeMap.get(cuenta.cuenta_padre_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export default async function PlanCuentasPage() {
  const supabase = await createClient()

  const { data: cuentas, error } = await supabase
    .from('plan_cuentas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('codigo')

  const tree = buildTree((cuentas as CuentaRow[]) ?? [])

  const totalCuentas = cuentas?.length ?? 0
  const imputables = cuentas?.filter((c: CuentaRow) => c.es_imputable).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Plan de Cuentas</h1>
            <p className="text-sm text-muted-foreground">
              {totalCuentas} cuentas en total, {imputables} imputables
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">
              Error al cargar el plan de cuentas: {error.message}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estructura contable</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanCuentasTree tree={tree} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
