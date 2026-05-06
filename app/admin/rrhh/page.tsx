import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, Banknote, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { fetchDashboardRRHH } from '@/app/admin/rrhh/_lib/queries'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export default async function RRHHDashboardPage() {
  const {
    totalEmpleados,
    contratosVigentes,
    costoMensualARS,
    liquidacionesPendientes,
    periodoActual,
  } = await fetchDashboardRRHH()

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Recursos Humanos</h1>
        <p className="text-sm text-muted-foreground">
          Panel de RRHH del club &mdash; {mesActual}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Empleados activos */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#3A8FC5]/10 p-2">
              <Users className="h-5 w-5 text-[#3A8FC5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEmpleados}</p>
              <p className="text-xs text-muted-foreground">Empleados activos</p>
            </div>
          </CardContent>
        </Card>

        {/* Contratos vigentes */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-emerald-500/10 p-2">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contratosVigentes}</p>
              <p className="text-xs text-muted-foreground">Contratos vigentes</p>
            </div>
          </CardContent>
        </Card>

        {/* Costo mensual estimado */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#F2C531]/10 p-2">
              <Banknote className="h-5 w-5 text-[#F2C531]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMoney(costoMensualARS)}</p>
              <p className="text-xs text-muted-foreground">Costo mensual estimado</p>
            </div>
          </CardContent>
        </Card>

        {/* Liquidaciones pendientes */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-red-500/10 p-2">
              <ClipboardList className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liquidacionesPendientes}</p>
              <p className="text-xs text-muted-foreground">
                Liquidaciones pendientes ({periodoActual})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rapidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/admin/rrhh/contratos" />}>
            <FileText className="h-4 w-4" />
            Ver contratos
          </Button>
          <Button variant="outline" render={<Link href="/admin/rrhh/liquidaciones" />}>
            <ClipboardList className="h-4 w-4" />
            Ver liquidaciones
          </Button>
          <Button render={<Link href="/admin/rrhh/contratos" />}>
            <FileText className="h-4 w-4" />
            Nuevo contrato
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
