'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, ArrowRightLeft, Receipt } from 'lucide-react'
import Link from 'next/link'
import { NuevoMovimientoDialog } from '../movimientos/_components/nuevo-movimiento-dialog'

interface FinanzasQuickActionsProps {
  cajas: { id: string; nombre: string; tipo: string; activa: boolean }[]
  categorias: { id: string; nombre: string; tipo: string }[]
  mediosPago: { id: string; nombre: string }[]
  centrosCosto: { id: string; nombre: string }[]
  productos: { id: string; nombre: string; sku: string | null; tipo_uso: string | null }[]
  cuentas: { id: string; codigo: string; nombre: string }[]
}

export function FinanzasQuickActions({
  cajas,
  categorias,
  mediosPago,
  centrosCosto,
  productos,
  cuentas,
}: FinanzasQuickActionsProps) {
  const [ingresoOpen, setIngresoOpen] = useState(false)
  const [egresoOpen, setEgresoOpen] = useState(false)
  const [transferenciaOpen, setTransferenciaOpen] = useState(false)

  const dialogProps = { cajas, categorias, mediosPago, centrosCosto, productos, cuentas }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acciones rapidas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={() => setIngresoOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo Ingreso
        </Button>
        <Button variant="destructive" onClick={() => setEgresoOpen(true)}>
          <Minus className="h-4 w-4" />
          Nuevo Egreso
        </Button>
        <Button variant="outline" onClick={() => setTransferenciaOpen(true)}>
          <ArrowRightLeft className="h-4 w-4" />
          Transferencia
        </Button>
        <Button variant="secondary" render={<Link href="/admin/finanzas/cuotas" />}>
          <Receipt className="h-4 w-4" />
          Emitir Cuotas
        </Button>

        <NuevoMovimientoDialog
          {...dialogProps}
          tipoInicial="ingreso"
          open={ingresoOpen}
          onOpenChange={setIngresoOpen}
        />
        <NuevoMovimientoDialog
          {...dialogProps}
          tipoInicial="egreso"
          open={egresoOpen}
          onOpenChange={setEgresoOpen}
        />
        <NuevoMovimientoDialog
          {...dialogProps}
          tipoInicial="transferencia"
          open={transferenciaOpen}
          onOpenChange={setTransferenciaOpen}
        />
      </CardContent>
    </Card>
  )
}
