'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Mail,
  Bell,
  FileText,
  Send,
} from 'lucide-react'
import {
  crearPlantilla,
  editarPlantilla,
  eliminarPlantilla,
  probarPlantilla,
} from '../../_actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Plantilla {
  id: string
  nombre: string
  slug: string
  tipo: string
  asunto: string | null
  cuerpo: string
  variables_disponibles: string[] | null
  activa: boolean
  created_at: string
  updated_at: string
}

interface PlantillasClientProps {
  plantillas: Plantilla[]
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function renderPreview(cuerpo: string, variables: string[]): string {
  let rendered = cuerpo
  for (const v of variables) {
    const regex = new RegExp(`\\{\\{${v}\\}\\}`, 'g')
    rendered = rendered.replace(regex, `[${v}]`)
  }
  return rendered
}

const TIPO_LABELS: Record<string, string> = {
  email: 'Email',
  inapp: 'In-App',
}

const TIPO_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  inapp: Bell,
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------

export function PlantillasClient({ plantillas: initialPlantillas }: PlantillasClientProps) {
  const [plantillas] = useState(initialPlantillas)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editando, setEditando] = useState<Plantilla | null>(null)
  const [previewPlantilla, setPreviewPlantilla] = useState<Plantilla | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [tipo, setTipo] = useState('email')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [variablesStr, setVariablesStr] = useState('')

  const filtradas = filtroTipo === 'todos'
    ? plantillas
    : plantillas.filter((p) => p.tipo === filtroTipo)

  function resetForm() {
    setNombre('')
    setSlug('')
    setTipo('email')
    setAsunto('')
    setCuerpo('')
    setVariablesStr('')
    setEditando(null)
  }

  function openCrear() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditar(p: Plantilla) {
    setEditando(p)
    setNombre(p.nombre)
    setSlug(p.slug)
    setTipo(p.tipo)
    setAsunto(p.asunto ?? '')
    setCuerpo(p.cuerpo)
    setVariablesStr((p.variables_disponibles ?? []).join(', '))
    setDialogOpen(true)
  }

  function openPreview(p: Plantilla) {
    setPreviewPlantilla(p)
    setPreviewOpen(true)
  }

  function handleNombreChange(value: string) {
    setNombre(value)
    if (!editando) {
      setSlug(slugify(value))
    }
  }

  function handleGuardar() {
    if (!nombre.trim() || !cuerpo.trim()) {
      toast.error('Nombre y cuerpo son obligatorios')
      return
    }

    const variables = variablesStr
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    startTransition(async () => {
      if (editando) {
        const result = await editarPlantilla(editando.id, {
          nombre: nombre.trim(),
          slug: slug.trim() || slugify(nombre),
          tipo,
          asunto: tipo === 'email' ? asunto.trim() : null,
          cuerpo: cuerpo.trim(),
          variables_disponibles: variables,
        })
        if (result.ok) {
          toast.success('Plantilla actualizada')
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await crearPlantilla({
          nombre: nombre.trim(),
          slug: slug.trim() || slugify(nombre),
          tipo,
          asunto: tipo === 'email' ? asunto.trim() : null,
          cuerpo: cuerpo.trim(),
          variables_disponibles: variables,
        })
        if (result.ok) {
          toast.success('Plantilla creada')
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error(result.message)
        }
      }
    })
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      const result = await eliminarPlantilla(id)
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
        toast.success('Email de prueba enviado')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
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
        <Button onClick={openCrear}>
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Button>
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
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nombre}</TableCell>
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
                              {(p.variables_disponibles ?? []).map((v) => (
                                <Badge key={v} variant="secondary" className="text-[10px]">
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
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
                              <DropdownMenuItem onClick={() => openPreview(p)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Vista previa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditar(p)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {p.tipo === 'email' && (
                                <DropdownMenuItem onClick={() => handleProbar(p.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Probar plantilla
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-error-600"
                                onClick={() => handleEliminar(p.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
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

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'Modifica los campos de la plantilla.'
                : 'Completa los datos para crear una nueva plantilla de comunicacion.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: Bienvenida nuevo socio"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="bienvenida-nuevo-socio"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Identificador unico. Se genera automaticamente del nombre.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v ?? 'email')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="inapp">In-App (notificacion interna)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="asunto">Asunto</Label>
                <Input
                  id="asunto"
                  placeholder="Ej: Bienvenido a {{club_nombre}}"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cuerpo">Cuerpo</Label>
              <Textarea
                id="cuerpo"
                placeholder="Hola {{nombre}}, te damos la bienvenida..."
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                rows={6}
              />
              <p className="text-[11px] text-muted-foreground">
                {'Usa {{variable}} para insertar datos dinamicos.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variables">Variables disponibles</Label>
              <Input
                id="variables"
                placeholder="nombre, apellido, club_nombre, fecha"
                value={variablesStr}
                onChange={(e) => setVariablesStr(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Separadas por coma. Ej: nombre, apellido, equipo
              </p>
            </div>

            {/* Preview inline */}
            {cuerpo.trim() && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Vista previa</p>
                <p className="text-sm whitespace-pre-wrap">
                  {renderPreview(
                    cuerpo,
                    variablesStr.split(',').map((v) => v.trim()).filter(Boolean)
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editando ? 'Guardar cambios' : 'Crear plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog vista previa */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vista previa: {previewPlantilla?.nombre}</DialogTitle>
            <DialogDescription>
              Asi se ve el contenido de la plantilla con variables de ejemplo.
            </DialogDescription>
          </DialogHeader>
          {previewPlantilla && (
            <div className="space-y-3">
              {previewPlantilla.asunto && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Asunto</p>
                  <p className="text-sm font-medium">
                    {renderPreview(
                      previewPlantilla.asunto,
                      previewPlantilla.variables_disponibles ?? []
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cuerpo</p>
                <div className="mt-1 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {renderPreview(
                      previewPlantilla.cuerpo,
                      previewPlantilla.variables_disponibles ?? []
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <p className="text-xs text-muted-foreground mr-1">Variables:</p>
                {(previewPlantilla.variables_disponibles ?? []).map((v) => (
                  <Badge key={v} variant="secondary" className="text-[10px]">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
