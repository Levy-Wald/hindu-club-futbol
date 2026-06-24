import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, TrendingUp, Wallet, AlertTriangle, CalendarClock, HeartPulse } from 'lucide-react'
import { fetchBIEjecutivo } from './_lib/queries'

function ars(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default async function DireccionPage() {
  const bi = await fetchBIEjecutivo()

  const kpis = [
    { label: 'Socios activos', value: bi.sociosActivos.toLocaleString('es-AR'), icon: Users },
    { label: 'Ingreso mensual estimado', value: ars(bi.ingresoMensualEstimado), icon: TrendingUp },
    { label: 'Cobrado (cuotas)', value: ars(bi.montoCobrado), icon: Wallet },
    { label: 'Pendiente de cobro', value: ars(bi.montoPendiente), icon: AlertTriangle, alerta: bi.montoPendiente > 0 },
    { label: 'Cuotas vencidas', value: bi.cuotasVencidas.toLocaleString('es-AR'), icon: AlertTriangle, alerta: bi.cuotasVencidas > 0 },
    { label: 'Jugadores lesionados', value: bi.jugadoresLesionados.toLocaleString('es-AR'), icon: HeartPulse },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dirección — BI ejecutivo</h1>
        <p className="text-sm text-muted-foreground">Indicadores clave del club. Solo lectura, en tiempo real.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className={`h-4 w-4 ${k.alerta ? 'text-destructive' : ''}`} />
                  <span className="text-xs">{k.label}</span>
                </div>
                <p className={`mt-1 text-xl font-bold tabular-nums ${k.alerta ? 'text-destructive' : ''}`}>{k.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Membresías por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membresías por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Activos</TableHead>
                    <TableHead className="text-right">Suspendidos</TableHead>
                    <TableHead className="text-right">Ingreso est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bi.membresiasPorTipo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={99} className="text-center text-muted-foreground py-6">Sin datos.</TableCell>
                    </TableRow>
                  ) : (
                    bi.membresiasPorTipo.map((m, i) => (
                      <TableRow key={`${m.tipo}-${m.disciplina_slug ?? i}`}>
                        <TableCell>
                          <span className="capitalize font-medium">{m.tipo}</span>
                          {m.disciplina_slug && <span className="text-xs text-muted-foreground ml-1">({m.disciplina_slug})</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{m.activos}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{m.suspendidos}</TableCell>
                        <TableCell className="text-right tabular-nums">{ars(m.ingreso_mensual_estimado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Próximos vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Próximos vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bi.proximosVencimientos.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Sin vencimientos próximos.</p>
            ) : (
              <ul className="divide-y">
                {bi.proximosVencimientos.map((v, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.titulo ?? v.tipo}</p>
                      {v.detalle && <p className="text-xs text-muted-foreground truncate">{v.detalle}</p>}
                    </div>
                    <Badge variant={v.dias_para_vencer != null && v.dias_para_vencer <= 3 ? 'destructive' : 'outline'} className="shrink-0">
                      {v.dias_para_vencer == null
                        ? '—'
                        : v.dias_para_vencer <= 0
                          ? 'vencido'
                          : `${v.dias_para_vencer} d`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
