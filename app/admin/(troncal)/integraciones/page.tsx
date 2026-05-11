import { Key, Activity, AlertTriangle, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiKeys, getApiLogs, getDashboardStats } from './_lib/queries'
import { IntegracionesClient } from './_components/integraciones-client'

export default async function IntegracionesPage() {
  const [apiKeys, logs, stats] = await Promise.all([
    getApiKeys(),
    getApiLogs(50),
    getDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground">API REST, API Keys y logs de uso</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Keys activas</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.keys_activas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requests hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requests_hoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Errores hoy</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errores_hoy}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Base URL</CardTitle>
          </div>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <code className="rounded bg-muted px-2 py-1 text-sm">
            https://hindu-club.vercel.app/api/v1
          </code>
          <p className="mt-2 text-sm text-muted-foreground">
            Endpoints: GET/POST /personas, GET/PATCH /personas/:id, GET /equipos
          </p>
        </CardContent>
      </Card>

      <IntegracionesClient apiKeys={apiKeys} logs={logs} />
    </div>
  )
}
