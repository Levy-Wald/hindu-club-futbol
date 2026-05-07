'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Key, Plus, Copy, Check, MoreHorizontal, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SCOPES, type Scope } from '@/lib/api/scopes'
import { crearApiKey, toggleApiKey, eliminarApiKey } from '../_actions'
import { cn } from '@/lib/utils'

interface ApiKey {
  id: string
  nombre: string
  descripcion: string | null
  key_prefix: string
  scopes: string[]
  rate_limit_por_minuto: number
  activa: boolean
  ultimo_uso_at: string | null
  expira_at: string | null
  created_at: string
}

interface ApiLog {
  id: string
  api_key_id: string | null
  method: string
  path: string
  status_code: number
  response_ms: number | null
  ip_address: string | null
  error_message: string | null
  created_at: string
}

interface Props {
  apiKeys: ApiKey[]
  logs: ApiLog[]
}

export function IntegracionesClient({ apiKeys, logs }: Props) {
  return (
    <Tabs defaultValue="keys" className="space-y-4">
      <TabsList>
        <TabsTrigger value="keys">API Keys ({apiKeys.length})</TabsTrigger>
        <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="keys">
        <ApiKeysTab apiKeys={apiKeys} />
      </TabsContent>

      <TabsContent value="logs">
        <LogsTab logs={logs} apiKeys={apiKeys} />
      </TabsContent>
    </Tabs>
  )
}

function ApiKeysTab({ apiKeys }: { apiKeys: ApiKey[] }) {
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set())

  async function handleCreate(formData: FormData) {
    setLoading(true)
    formData.set('scopes', Array.from(selectedScopes).join(','))
    const result = await crearApiKey(formData)
    setLoading(false)
    if (result.key) {
      setCreatedKey(result.key)
    }
  }

  function handleCopy() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  async function handleToggle(id: string, activa: boolean) {
    await toggleApiKey(id, activa)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta API key? Las integraciones que la usen dejaran de funcionar.')) return
    await eliminarApiKey(id)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Key className="h-4 w-4" /> API Keys
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setCreatedKey(null)
            setSelectedScopes(new Set())
          }
        }}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nueva API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{createdKey ? 'API Key creada' : 'Nueva API Key'}</DialogTitle>
            </DialogHeader>

            {createdKey ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Copia esta key ahora. No se mostrara de nuevo.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all font-mono">
                    {createdKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setDialogOpen(false); setCreatedKey(null) }}>
                    Listo
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" placeholder="Mi integracion" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripcion (opcional)</Label>
                  <Input id="descripcion" name="descripcion" placeholder="Para que se usa" />
                </div>
                <div className="space-y-2">
                  <Label>Permisos</Label>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(SCOPES).map(([scope, label]) => (
                      <label key={scope} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScopes.has(scope)}
                          onChange={() => toggleScope(scope)}
                          className="rounded"
                        />
                        <span className="font-mono text-xs">{scope}</span>
                        <span className="text-muted-foreground">— {label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Rate limit (req/min)</Label>
                  <Input id="rate_limit" name="rate_limit" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expira_at">Expira (opcional)</Label>
                  <Input id="expira_at" name="expira_at" type="date" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading || selectedScopes.size === 0}>
                    {loading ? 'Creando...' : 'Crear API Key'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay API keys. Crea una para empezar a usar la API.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Prefijo</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ultimo uso</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{k.nombre}</span>
                      {k.descripcion && (
                        <p className="text-xs text-muted-foreground">{k.descripcion}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{k.key_prefix}...</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.activa ? 'default' : 'destructive'}>
                      {k.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.ultimo_uso_at
                      ? formatDistanceToNow(new Date(k.ultimo_uso_at), { addSuffix: true, locale: es })
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggle(k.id, !k.activa)}>
                          {k.activa ? (
                            <><ToggleLeft className="mr-2 h-4 w-4" /> Desactivar</>
                          ) : (
                            <><ToggleRight className="mr-2 h-4 w-4" /> Activar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(k.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function LogsTab({ logs, apiKeys }: { logs: ApiLog[]; apiKeys: ApiKey[] }) {
  const keyMap = new Map(apiKeys.map((k) => [k.id, k.nombre]))

  function statusColor(code: number) {
    if (code < 300) return 'text-green-600'
    if (code < 400) return 'text-yellow-600'
    return 'text-red-600'
  }

  function methodColor(method: string) {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'POST': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'PATCH': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultimos requests</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay logs. Los requests a la API apareceran aca.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuando</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] font-mono', methodColor(log.method))}>
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {log.path}
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-mono text-sm font-bold', statusColor(log.status_code))}>
                        {log.status_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.response_ms != null ? `${log.response_ms}ms` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.api_key_id ? keyMap.get(log.api_key_id) || 'Desconocida' : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
