'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Copy, Trash2, ArrowLeft, Send } from 'lucide-react'
import {
  crearPlantilla,
  actualizarPlantilla,
  softDeletePlantilla,
  duplicarPlantilla,
} from '@/modules/comunicaciones/lib/actions'
import { extractVariablesFromTemplate } from '@/modules/comunicaciones/lib/plantillas/parser'
import { PlantillaPreviewPanel } from './plantilla-preview-panel'
import { TiptapEditor, insertVariableAtCursor } from './tiptap-editor'
import { VariablesSidebar } from './variables-sidebar'
import { TestSendModal } from './test-send-modal'
import type { Editor } from '@tiptap/react'

interface Plantilla {
  id: string
  nombre: string
  slug: string
  tipo: string
  descripcion: string | null
  asunto: string | null
  cuerpo: string
  body_html?: string | null
  variables_disponibles: string[] | null
  activa: boolean
  version?: number
  metadata: Record<string, unknown> | null
}

interface Variable {
  slug: string
  descripcion: string
  contexto: string
  ejemplo: string | null
}

interface PlantillaEditorFormProps {
  plantilla?: Plantilla
  permisos: {
    puede_crear: boolean
    puede_editar: boolean
    puede_eliminar: boolean
    puede_duplicar: boolean
  }
  variablesDisponibles?: Variable[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function PlantillaEditorForm({ plantilla, permisos, variablesDisponibles = [] }: PlantillaEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!plantilla
  const esSistema = plantilla?.metadata?.es_sistema === true
  const editorRef = useRef<Editor | null>(null)

  const [nombre, setNombre] = useState(plantilla?.nombre ?? '')
  const [slug, setSlug] = useState(plantilla?.slug ?? '')
  const [tipo, setTipo] = useState(plantilla?.tipo ?? 'email')
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? '')
  const [asunto, setAsunto] = useState(plantilla?.asunto ?? '')
  const [cuerpo, setCuerpo] = useState(plantilla?.cuerpo ?? '')
  const [bodyHtml, setBodyHtml] = useState(plantilla?.body_html ?? '')
  const [activa, setActiva] = useState(plantilla?.activa ?? true)
  const [variablesManual, setVariablesManual] = useState<string[]>(
    plantilla?.variables_disponibles ?? []
  )

  const [duplicarDialogOpen, setDuplicarDialogOpen] = useState(false)
  const [duplicarSlug, setDuplicarSlug] = useState('')
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)
  const [testSendOpen, setTestSendOpen] = useState(false)

  // Auto-detect variables from content
  const variablesDetectadas = extractVariablesFromTemplate(
    tipo === 'email' ? asunto : null,
    cuerpo
  )
  const variablesTodas = Array.from(new Set([...variablesManual, ...variablesDetectadas])).sort()
  const variablesNuevas = variablesDetectadas.filter(v => !variablesManual.includes(v))

  function handleNombreChange(value: string) {
    setNombre(value)
    if (!isEdit) {
      setSlug(slugify(value))
    }
  }

  function handleTiptapChange(html: string) {
    setBodyHtml(html)
    // Extract text from HTML for the cuerpo field (plain text fallback)
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    setCuerpo(tmp.textContent ?? '')
  }

  function handleInsertVariable(variableSlug: string) {
    if (editorRef.current) {
      insertVariableAtCursor(editorRef.current, variableSlug)
    }
  }

  function handleGuardar() {
    if (!nombre.trim() || (!cuerpo.trim() && !bodyHtml.trim())) {
      toast.error('Nombre y cuerpo son obligatorios')
      return
    }
    if (!slug.trim()) {
      toast.error('El slug es obligatorio')
      return
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await actualizarPlantilla(plantilla.id, {
          nombre: nombre.trim(),
          slug: slug.trim(),
          tipo,
          descripcion: descripcion.trim() || null,
          asunto: tipo === 'email' ? asunto.trim() : null,
          cuerpo: cuerpo.trim(),
          body_html: bodyHtml.trim() || undefined,
          variables_disponibles: variablesTodas,
          activa,
        })
        if (result.ok) {
          toast.success('Plantilla actualizada')
          router.push('/admin/comunicaciones')
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await crearPlantilla({
          nombre: nombre.trim(),
          slug: slug.trim(),
          tipo,
          descripcion: descripcion.trim() || null,
          asunto: tipo === 'email' ? asunto.trim() : null,
          cuerpo: cuerpo.trim(),
          variables_disponibles: variablesTodas,
        })
        if (result.ok) {
          toast.success('Plantilla creada')
          router.push('/admin/comunicaciones')
          router.refresh()
        } else {
          toast.error(result.message)
        }
      }
    })
  }

  function handleDuplicar() {
    if (!duplicarSlug.trim()) {
      toast.error('Ingresa un slug para la copia')
      return
    }
    startTransition(async () => {
      const result = await duplicarPlantilla(plantilla!.id, duplicarSlug.trim())
      if (result.ok) {
        toast.success('Plantilla duplicada')
        setDuplicarDialogOpen(false)
        router.push('/admin/comunicaciones')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await softDeletePlantilla(plantilla!.id)
      if (result.ok) {
        toast.success('Plantilla eliminada')
        setEliminarDialogOpen(false)
        router.push('/admin/comunicaciones')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6" data-testid="plantilla-editor">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/comunicaciones')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              {isEdit ? 'Editar plantilla' : 'Nueva plantilla'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {esSistema && (
                <Badge variant="outline" className="text-[10px]" data-testid="badge-sistema">
                  Plantilla del sistema
                </Badge>
              )}
              {isEdit && plantilla.version && (
                <Badge variant="secondary" className="text-[10px]">
                  v{plantilla.version}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGuardar} disabled={isPending} size="sm" data-testid="btn-guardar">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
          {isEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestSendOpen(true)}
            >
              <Send className="h-4 w-4" />
              Test send
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/comunicaciones')}
          >
            Cancelar
          </Button>
          {isEdit && permisos.puede_duplicar && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDuplicarSlug(slug + '-copia')
                setDuplicarDialogOpen(true)
              }}
            >
              <Copy className="h-4 w-4" />
              Duplicar
            </Button>
          )}
          {isEdit && permisos.puede_eliminar && (
            <Button
              variant="destructive"
              size="sm"
              disabled={esSistema}
              title={esSistema ? 'Las plantillas del sistema no se pueden eliminar' : undefined}
              onClick={() => setEliminarDialogOpen(true)}
              data-testid="btn-eliminar"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* 3-column layout: form | preview | variables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_320px_240px]">
        {/* Left: Form */}
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Bienvenida nuevo socio"
                    value={nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    data-testid="input-nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="bienvenida-nuevo-socio"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={isEdit}
                    data-testid="input-slug"
                  />
                  {!isEdit && (
                    <p className="text-[11px] text-muted-foreground">
                      Identificador unico. Inmutable despues de crear.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v ?? 'email')}
                    disabled={esSistema}
                  >
                    <SelectTrigger data-testid="select-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="inapp">In-App (notificacion interna)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="activa"
                      checked={activa}
                      onCheckedChange={setActiva}
                    />
                    <Label htmlFor="activa" className="text-sm">
                      {activa ? 'Activa' : 'Inactiva'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion (opcional)</Label>
                <Input
                  id="descripcion"
                  placeholder="Descripcion interna de la plantilla"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {tipo === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto</Label>
                  <Input
                    id="asunto"
                    placeholder="Ej: Bienvenido a {{club_nombre}}, {{nombre}}!"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    data-testid="input-asunto"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Cuerpo (editor rich text)</Label>
                <TiptapEditor
                  content={bodyHtml || cuerpo}
                  onChange={handleTiptapChange}
                  onEditorReady={(editor) => { editorRef.current = editor }}
                />
                <p className="text-[11px] text-muted-foreground">
                  {'Usa {{variable}} para insertar datos dinamicos. Click en las variables del panel lateral para insertarlas.'}
                </p>
              </div>

              {/* Variables display */}
              {variablesTodas.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables detectadas</Label>
                  <div className="flex flex-wrap gap-1">
                    {variablesTodas.map(v => (
                      <Badge
                        key={v}
                        variant={variablesNuevas.includes(v) ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {`{{${v}}}`}
                        {variablesNuevas.includes(v) && (
                          <span className="ml-1 opacity-70">auto</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Middle: Preview */}
        <div className="hidden lg:block">
          <PlantillaPreviewPanel
            tipo={tipo}
            asunto={tipo === 'email' ? asunto : ''}
            cuerpo={bodyHtml || cuerpo}
            variables={variablesTodas}
          />
        </div>

        {/* Right: Variables catalog */}
        <div className="hidden xl:block">
          <VariablesSidebar
            variables={variablesDisponibles}
            onInsert={handleInsertVariable}
          />
        </div>
      </div>

      {/* Test send modal */}
      {isEdit && (
        <TestSendModal
          plantillaId={plantilla.id}
          canal={tipo}
          open={testSendOpen}
          onOpenChange={setTestSendOpen}
        />
      )}

      {/* Duplicar dialog */}
      <Dialog open={duplicarDialogOpen} onOpenChange={setDuplicarDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Duplicar plantilla</DialogTitle>
            <DialogDescription>
              Ingresa el slug para la copia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicar-slug">Slug de la copia</Label>
            <Input
              id="duplicar-slug"
              value={duplicarSlug}
              onChange={(e) => setDuplicarSlug(e.target.value)}
              data-testid="input-duplicar-slug"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicar} disabled={isPending} data-testid="btn-confirmar-duplicar">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar confirmation dialog */}
      <Dialog open={eliminarDialogOpen} onOpenChange={setEliminarDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar plantilla</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. La plantilla dejara de estar disponible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
