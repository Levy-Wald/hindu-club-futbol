'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Copy,
  Mail,
  Bell,
  FileText,
  Shield,
} from 'lucide-react'
import {
  softDeletePlantilla,
  probarPlantilla,
} from '@/modules/comunicaciones/lib/actions'

interface Plantilla {
  id: string
  nombre: string
  slug: string
  tipo: string
  asunto: string | null
  cuerpo: string
  variables_disponibles: string[] | null
  activa: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface PlantillasTableProps {
  plantillas: Plantilla[]
  permisos: {
    puede_crear: boolean
    puede_editar: boolean
    puede_eliminar: boolean
    puede_duplicar: boolean
  }
}

const TIPO_LABELS: Record<string, string> = {
  email: 'Email',
  inapp: 'In-App',
}

const TIPO_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  inapp: Bell,
}

export function PlantillasTable({ plantillas: initialPlantillas, permisos }: PlantillasTableProps) {
  const [plantillas] = useState(initialPlantillas)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [isPending, startTransition] = useTransition()

  const filtradas = filtroTipo === 'todos'
    ? plantillas
    : plantillas.filter((p) => p.tipo === filtroTipo)

  function handleEliminar(id: string, esSistema: boolean) {
    if (esSistema) {
      toast.error('No se puede eliminar una plantilla del sistema')
      return
    }
    startTransition(async () => {
      const result = await softDeletePlantilla(id)
      if (result.ok) {
        toast.success('Plantilla eliminada')
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleProbar(id: string) {
    startTransition(async () => {
      const result = await probarPlantilla(id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4" data-testid="plantillas-section">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v ?? 'todos')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="inapp">In-App</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {permisos.puede_crear && (
          <Button render={<Link href="/admin/comunicaciones/plantillas/nueva" />} data-testid="btn-nueva-plantilla">
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay plantillas creadas todavia.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((p) => {
                    const TipoIcon = TIPO_ICONS[p.tipo] ?? Mail
                    const esSistema = p.metadata?.es_sistema === true
                    return (
                      <TableRow key={p.id} data-testid="plantillas-row">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {p.nombre}
                            {esSistema && (
                              <Shield className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TipoIcon className="h-3 w-3" />
                            {TIPO_LABELS[p.tipo] ?? p.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {p.asunto || '—'}
                        </TableCell>
                        <TableCell>
                          {(p.variables_disponibles ?? []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(p.variables_disponibles ?? []).slice(0, 3).map((v) => (
                                <Badge key={v} variant="secondary" className="text-[10px]">
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
                              {(p.variables_disponibles ?? []).length > 3 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{(p.variables_disponibles ?? []).length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.activa ? 'default' : 'secondary'}>
                            {p.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {permisos.puede_editar && (
                                <DropdownMenuItem
                                  render={<Link href={`/admin/comunicaciones/plantillas/${p.id}/editar`} />}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleProbar(p.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Probar
                              </DropdownMenuItem>
                              {permisos.puede_duplicar && (
                                <DropdownMenuItem
                                  render={<Link href={`/admin/comunicaciones/plantillas/${p.id}/editar?duplicar=1`} />}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                              )}
                              {permisos.puede_eliminar && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-error-600"
                                    disabled={esSistema}
                                    onClick={() => handleEliminar(p.id, esSistema)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                    {esSistema && <span className="ml-1 text-[10px]">(sistema)</span>}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  )
}
