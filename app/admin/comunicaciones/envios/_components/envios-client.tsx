'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { RefreshCw, Send, Loader2 } from 'lucide-react'
import { reenviarEnvio } from '../../_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Envio {
  id: string
  canal: string
  estado: string
  error_detalle: string | null
  created_at: string
  destinatario: { id: string; nombre: string; apellido: string; email: string | null } | null
  plantilla: { id: string; nombre: string } | null
}

interface EnviosClientProps {
  envios: Envio[]
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ESTADO_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pendiente: { variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
  enviado: { variant: 'outline', className: 'border-blue-500 text-blue-700 bg-blue-50' },
  fallado: { variant: 'destructive', className: '' },
  entregado: { variant: 'outline', className: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
  leido: { variant: 'secondary', className: '' },
}

const CANAL_LABELS: Record<string, string> = {
  email: 'Email',
  inapp: 'In-App',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function EnviosClient({ envios: initialEnvios }: EnviosClientProps) {
  const [envios] = useState(initialEnvios)
  const [filtroCanal, setFiltroCanal] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtrados = envios.filter((e) => {
    if (filtroCanal !== 'todos' && e.canal !== filtroCanal) return false
    if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false
    if (filtroFecha) {
      const envioFecha = e.created_at.split('T')[0]
      if (envioFecha < filtroFecha) return false
    }
    return true
  })

  function handleReenviar(envioId: string) {
    startTransition(async () => {
      const result = await reenviarEnvio(envioId)
      if (result.ok) {
        toast.success('Reenvio programado')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v ?? 'todos')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="inapp">In-App</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? 'todos')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="fallado">Fallado</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
            <SelectItem value="leido">Leido</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[160px]"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          placeholder="Desde fecha"
        />

        {(filtroCanal !== 'todos' || filtroEstado !== 'todos' || filtroFecha) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFiltroCanal('todos')
              setFiltroEstado('todos')
              setFiltroFecha('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay envios registrados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((e) => {
                    const estadoStyle = ESTADO_BADGES[e.estado] ?? ESTADO_BADGES.pendiente
                    const destinatarioNombre = e.destinatario
                      ? `${e.destinatario.nombre} ${e.destinatario.apellido}`
                      : '—'

                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatFecha(e.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CANAL_LABELS[e.canal] ?? e.canal}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {destinatarioNombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.plantilla?.nombre ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoStyle.variant} className={estadoStyle.className}>
                            {e.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {e.error_detalle || '—'}
                        </TableCell>
                        <TableCell>
                          {e.estado === 'fallado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleReenviar(e.id)}
                              disabled={isPending}
                              title="Reenviar"
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
