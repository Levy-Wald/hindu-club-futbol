'use client'

import { useState, useRef, useCallback, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Move } from 'lucide-react'
import type { DiagramaShape } from '../lib/schema'
import { crearShape, actualizarShape, eliminarShape } from '../lib/actions'
import { fetchShapes } from '../lib/queries'

interface Espacio {
  id: string
  nombre: string
  tipo_slug: string
}

interface Sede {
  id: string
  nombre: string
}

interface DiagramaCanvasProps {
  shapesInicial: DiagramaShape[]
  espacios: Espacio[]
  sedes: Sede[]
}

const CANVAS_W = 800
const CANVAS_H = 500

export function DiagramaCanvas({ shapesInicial, espacios, sedes }: DiagramaCanvasProps) {
  const [shapes, setShapes] = useState<DiagramaShape[]>(shapesInicial)
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [filtroSede, setFiltroSede] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const svgRef = useRef<SVGSVGElement>(null)

  const selectedShape = shapes.find(s => s.id === selected)
  const shapesVisibles = filtroSede
    ? shapes.filter(s => s.sede_id === filtroSede)
    : shapes

  async function reload() {
    const data = await fetchShapes()
    setShapes(data)
  }

  function getSVGPoint(e: React.MouseEvent) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    }
  }

  function handleMouseDown(e: React.MouseEvent, shapeId: string) {
    e.stopPropagation()
    const pt = getSVGPoint(e)
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape) return
    setDragging(shapeId)
    setSelected(shapeId)
    setDragOffset({ x: pt.x - Number(shape.pos_x), y: pt.y - Number(shape.pos_y) })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const pt = getSVGPoint(e)
    setShapes(prev => prev.map(s =>
      s.id === dragging
        ? { ...s, pos_x: Math.max(0, Math.min(CANVAS_W - Number(s.ancho), pt.x - dragOffset.x)), pos_y: Math.max(0, Math.min(CANVAS_H - Number(s.alto), pt.y - dragOffset.y)) }
        : s
    ))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    if (!dragging) return
    const shape = shapes.find(s => s.id === dragging)
    setDragging(null)
    if (shape) {
      startTransition(async () => {
        await actualizarShape(shape.id, { pos_x: Number(shape.pos_x), pos_y: Number(shape.pos_y) })
      })
    }
  }, [dragging, shapes])

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === svgRef.current) {
      setSelected(null)
    }
  }

  function handleAddShape() {
    startTransition(async () => {
      const result = await crearShape({
        pos_x: 50 + Math.random() * 200,
        pos_y: 50 + Math.random() * 200,
        ancho: 120,
        alto: 80,
        rotacion: 0,
        forma: 'rectangle',
        color_fondo: '#4F46E5',
        color_borde: '#1E1B4B',
        texto_label: 'Nuevo',
        capa: 1,
      })
      if (result.ok) {
        await reload()
        if (result.id) setSelected(result.id)
        toast.success('Shape creado')
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  function handleDeleteShape() {
    if (!selected) return
    if (!confirm('¿Eliminar este elemento del mapa?')) return
    startTransition(async () => {
      const result = await eliminarShape(selected)
      if (result.ok) {
        setSelected(null)
        await reload()
        toast.success('Eliminado')
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  function handleUpdateField(field: string, value: string | number | null) {
    if (!selected) return
    setShapes(prev => prev.map(s => s.id === selected ? { ...s, [field]: value } : s))
    startTransition(async () => {
      await actualizarShape(selected, { [field]: value })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mapa del Club</h1>
          <p className="text-sm text-muted-foreground">Diagramación visual del predio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtroSede} onValueChange={v => setFiltroSede(!v || v === 'todas' ? '' : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas las sedes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {sedes.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddShape} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Agregar espacio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Canvas */}
        <Card>
          <CardContent className="p-2">
            <div className="border rounded-lg overflow-hidden bg-green-50 dark:bg-green-950/20" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-green-300 dark:text-green-800" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Shapes */}
                {shapesVisibles.map(s => {
                  const x = Number(s.pos_x)
                  const y = Number(s.pos_y)
                  const w = Number(s.ancho)
                  const h = Number(s.alto)
                  const isSelected = s.id === selected
                  const isDragging = s.id === dragging

                  return (
                    <g
                      key={s.id}
                      onMouseDown={e => handleMouseDown(e, s.id)}
                      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                    >
                      {s.forma === 'circle' ? (
                        <ellipse
                          cx={x + w / 2}
                          cy={y + h / 2}
                          rx={w / 2}
                          ry={h / 2}
                          fill={s.color_fondo}
                          stroke={isSelected ? '#f59e0b' : s.color_borde}
                          strokeWidth={isSelected ? 3 : 1.5}
                          opacity={0.85}
                        />
                      ) : (
                        <rect
                          x={x}
                          y={y}
                          width={w}
                          height={h}
                          rx={6}
                          fill={s.color_fondo}
                          stroke={isSelected ? '#f59e0b' : s.color_borde}
                          strokeWidth={isSelected ? 3 : 1.5}
                          opacity={0.85}
                        />
                      )}
                      <text
                        x={x + w / 2}
                        y={y + h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize={Math.min(14, w / 6)}
                        fontWeight="600"
                        pointerEvents="none"
                      >
                        {s.texto_label || s.espacio_nombre || ''}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Move className="h-3 w-3" /> Arrastrá los elementos para moverlos. Click para seleccionar.
            </p>
          </CardContent>
        </Card>

        {/* Editor panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedShape ? 'Editar elemento' : 'Sin selección'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedShape ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={selectedShape.texto_label ?? ''}
                    onChange={e => handleUpdateField('texto_label', e.target.value)}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label className="text-xs">Espacio vinculado</Label>
                  <Select
                    value={selectedShape.espacio_id ?? ''}
                    onValueChange={v => handleUpdateField('espacio_id', !v || v === 'ninguno' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin vincular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin vincular</SelectItem>
                      {espacios.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.tipo_slug})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sede</Label>
                  <Select
                    value={selectedShape.sede_id ?? ''}
                    onValueChange={v => handleUpdateField('sede_id', !v || v === 'ninguna' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Sin sede</SelectItem>
                      {sedes.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Forma</Label>
                  <Select
                    value={selectedShape.forma}
                    onValueChange={v => v && handleUpdateField('forma', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectángulo</SelectItem>
                      <SelectItem value="circle">Elipse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Color fondo</Label>
                    <Input
                      type="color"
                      value={selectedShape.color_fondo}
                      onChange={e => handleUpdateField('color_fondo', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color borde</Label>
                    <Input
                      type="color"
                      value={selectedShape.color_borde}
                      onChange={e => handleUpdateField('color_borde', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Ancho</Label>
                    <Input
                      type="number"
                      value={Number(selectedShape.ancho)}
                      onChange={e => handleUpdateField('ancho', Number(e.target.value))}
                      min={10}
                      max={500}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alto</Label>
                    <Input
                      type="number"
                      value={Number(selectedShape.alto)}
                      onChange={e => handleUpdateField('alto', Number(e.target.value))}
                      min={10}
                      max={500}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Capa (z-index)</Label>
                  <Input
                    type="number"
                    value={selectedShape.capa}
                    onChange={e => handleUpdateField('capa', Number(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDeleteShape}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Seleccioná un elemento del mapa para editarlo, o agregá uno nuevo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
