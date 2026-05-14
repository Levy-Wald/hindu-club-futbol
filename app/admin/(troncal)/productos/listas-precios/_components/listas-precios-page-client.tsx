'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ListaPreciosFormDialog } from '@/modules/pim/ui/lista-precios-form'
import { ListaPreciosRow } from '@/modules/pim/ui/lista-precios-row'
import { seedListasEstandarAction } from '@/modules/pim/lib/actions'
import type { ListaPrecios, TipoLista } from '@/modules/pim/lib/tipos'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'

const TIPO_LABELS: Record<TipoLista, string> = {
  compra: 'Compra',
  costo: 'Costos',
  venta: 'Venta',
}

const TIPO_ORDER: TipoLista[] = ['compra', 'costo', 'venta']

interface Props {
  listas: ListaPrecios[]
}

export function ListasPreciosPageClient({ listas }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSeed() {
    startTransition(async () => {
      const res = await seedListasEstandarAction()
      if (res.ok) {
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const grouped = TIPO_ORDER.map((tipo) => ({
    tipo,
    label: TIPO_LABELS[tipo],
    items: listas.filter((l) => l.tipo === tipo),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Listas de Precios</h1>
        <ListaPreciosFormDialog mode="create" />
      </div>

      {listas.length === 0 ? (
        <div className="text-center py-12 border rounded-lg space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">No hay listas de precios</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea las 8 listas estandar (compra, costos, venta por canal) para empezar.
            </p>
          </div>
          <Button onClick={handleSeed} disabled={isPending}>
            {isPending ? 'Creando...' : 'Cargar listas estandar (8)'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.tipo}>
              <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wider mb-2">
                {group.label} ({group.items.length})
              </h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground border rounded-lg p-4">
                  Sin listas de tipo {group.label.toLowerCase()}.
                </p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {group.items.map((lista) => (
                    <ListaPreciosRow key={lista.id} lista={lista} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
