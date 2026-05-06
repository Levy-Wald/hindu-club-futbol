'use client'

import { useState, useTransition, useRef, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Palette, FileText, Phone, Scale, Image as ImageIcon,
  Upload, Loader2, Save, Trophy, X, Plus, ChevronDown, ChevronRight,
  LayoutDashboard, Film, Undo2, Globe,
} from 'lucide-react'
import { actualizarConfigPublica, uploadBrandingAsset } from '../_actions'

type Config = Record<string, unknown> | null

interface BrandingFormProps {
  config: Config
}

// -- Constantes --

const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Oswald',
  'Playfair Display',
  'Roboto',
  'Open Sans',
  'Lato',
]

interface HomeSection {
  key: string
  label: string
  description: string
  fields: Array<{ key: string; label: string; type: 'input' | 'textarea' }>
}

const HOME_SECTIONS: HomeSection[] = [
  {
    key: 'hero',
    label: 'Hero principal',
    description: 'Titulo y bajada que se ven al entrar al sitio',
    fields: [
      { key: 'hero_titulo', label: 'Titulo', type: 'input' },
      { key: 'hero_bajada', label: 'Bajada', type: 'textarea' },
    ],
  },
  {
    key: 'eventos',
    label: 'Proximos eventos',
    description: 'Seccion de eventos en la home',
    fields: [
      { key: 'eventos_titulo', label: 'Titulo de la seccion', type: 'input' },
    ],
  },
  {
    key: 'ligas',
    label: 'Ligas y torneos',
    description: 'Seccion de ligas y competencias',
    fields: [
      { key: 'ligas_titulo', label: 'Titulo de la seccion', type: 'input' },
    ],
  },
  {
    key: 'capitanes',
    label: 'Capitanes',
    description: 'Seccion de capitanes del club',
    fields: [
      { key: 'capitanes_titulo', label: 'Titulo de la seccion', type: 'input' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff tecnico',
    description: 'Seccion del cuerpo tecnico',
    fields: [
      { key: 'staff_titulo', label: 'Titulo de la seccion', type: 'input' },
    ],
  },
  {
    key: 'asociate_cta',
    label: 'Llamado a asociarse',
    description: 'CTA para nuevos socios en la home',
    fields: [
      { key: 'asociate_cta_titulo', label: 'Titulo', type: 'input' },
      { key: 'asociate_cta_bajada', label: 'Bajada', type: 'textarea' },
    ],
  },
  {
    key: 'contacto',
    label: 'Contacto',
    description: 'Seccion de contacto en la home',
    fields: [
      { key: 'contacto_titulo', label: 'Titulo de la seccion', type: 'input' },
    ],
  },
  {
    key: 'palmares',
    label: 'Palmares',
    description: 'Trofeos, copas y campeonatos del club',
    fields: [], // tiene editor especial
  },
]

const MEDIA_TAGS = ['Sin asignar', 'Hero', 'Home', 'Asociate', 'Galeria general']

// -- Componente principal --

export function BrandingForm({ config }: BrandingFormProps) {
  const initialConfig = useMemo(() => config ?? {}, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [formData, setFormData] = useState<Record<string, unknown>>(config ?? {})
  const [isPending, startTransition] = useTransition()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // -- Helpers de acceso --

  function getValue(key: string, fallback = ''): string {
    const val = formData[key]
    if (val == null) return fallback
    return String(val)
  }

  function getBool(key: string, fallback = false): boolean {
    const val = formData[key]
    if (val == null) return fallback
    return Boolean(val)
  }

  function getArray(key: string): string[] {
    const val = formData[key]
    if (!Array.isArray(val)) return []
    return val as string[]
  }

  function getRedes(): Record<string, string> {
    const val = formData.redes
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, string>
    }
    return {}
  }

  function getMedia(): Array<{ url: string; seccion: string }> {
    const val = formData.media
    if (Array.isArray(val)) return val as Array<{ url: string; seccion: string }>
    return []
  }

  function setField(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function setRedSocial(red: string, value: string) {
    const redes = getRedes()
    setFormData((prev) => ({
      ...prev,
      redes: { ...redes, [red]: value },
    }))
  }

  function getPalmares(): Array<{ anio: number; titulo: string; tipo: string; descripcion: string }> {
    const val = formData.palmares
    if (Array.isArray(val)) return val as Array<{ anio: number; titulo: string; tipo: string; descripcion: string }>
    return []
  }

  function updatePalmares(index: number, field: string, value: unknown) {
    const items = [...getPalmares()]
    items[index] = { ...items[index], [field]: value }
    setField('palmares', items)
  }

  function addPalmares() {
    const items = [...getPalmares()]
    items.push({ anio: new Date().getFullYear(), titulo: '', tipo: 'copa', descripcion: '' })
    setField('palmares', items)
  }

  function removePalmares(index: number) {
    const items = getPalmares().filter((_, i) => i !== index)
    setField('palmares', items)
  }

  // -- Dirty detection --

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialConfig)
  }, [formData, initialConfig])

  function handleDiscard() {
    setFormData({ ...initialConfig })
    toast.info('Cambios descartados')
  }

  // -- Save --

  function handleSave() {
    startTransition(async () => {
      const result = await actualizarConfigPublica(formData)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  // -- Section toggle --

  function toggleExpanded(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // -- Media helpers --

  function updateMediaTag(index: number, seccion: string) {
    const media = [...getMedia()]
    media[index] = { ...media[index], seccion }
    setField('media', media)
  }

  function removeMedia(index: number) {
    const media = getMedia().filter((_, i) => i !== index)
    setField('media', media)
  }

  // -- Render --

  return (
    <div className="relative">
      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b shadow-sm p-3 flex items-center justify-between gap-3 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Cambios sin guardar
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={isPending}
            >
              <Undo2 className="h-4 w-4 mr-1.5" />
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="identidad" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="identidad">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Identidad</span>
          </TabsTrigger>
          <TabsTrigger value="contenido">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
          <TabsTrigger value="contacto">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contacto</span>
          </TabsTrigger>
          <TabsTrigger value="paginas">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Paginas</span>
          </TabsTrigger>
          <TabsTrigger value="legal">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Legal</span>
          </TabsTrigger>
          <TabsTrigger value="media">
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ Tab 1: Identidad ============ */}
        <TabsContent value="identidad" className="mt-6 space-y-6">
          {/* Datos de identidad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de identidad</CardTitle>
              <CardDescription>Nombre, slogan y descripcion del club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_display">Nombre a mostrar</Label>
                  <Input
                    id="nombre_display"
                    value={getValue('nombre_display')}
                    onChange={(e) => setField('nombre_display', e.target.value)}
                    placeholder="Hindu Club Futbol"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input
                    id="slogan"
                    value={getValue('slogan')}
                    onChange={(e) => setField('slogan', e.target.value)}
                    placeholder="Pasion, compromiso y comunidad"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={getValue('descripcion')}
                  onChange={(e) => setField('descripcion', e.target.value)}
                  placeholder="Descripcion del club para la pagina publica..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colores</CardTitle>
              <CardDescription>Colores de marca del club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color_primario">Color primario</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="color_primario"
                      value={getValue('color_primario', '#3A8FC5')}
                      onChange={(e) => setField('color_primario', e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={getValue('color_primario', '#3A8FC5')}
                      onChange={(e) => setField('color_primario', e.target.value)}
                      placeholder="#3A8FC5"
                      className="flex-1 font-mono text-sm"
                    />
                    <div
                      className="h-10 w-10 rounded-lg border shrink-0"
                      style={{ backgroundColor: getValue('color_primario', '#3A8FC5') }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color_secundario">Color secundario</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="color_secundario"
                      value={getValue('color_secundario', '#F2C531')}
                      onChange={(e) => setField('color_secundario', e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={getValue('color_secundario', '#F2C531')}
                      onChange={(e) => setField('color_secundario', e.target.value)}
                      placeholder="#F2C531"
                      className="flex-1 font-mono text-sm"
                    />
                    <div
                      className="h-10 w-10 rounded-lg border shrink-0"
                      style={{ backgroundColor: getValue('color_secundario', '#F2C531') }}
                    />
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Vista previa</Label>
                <div
                  className="mt-2 rounded-xl p-6 text-white flex items-center gap-4"
                  style={{
                    background: `linear-gradient(135deg, ${getValue('color_primario', '#3A8FC5')} 0%, ${getValue('color_secundario', '#F2C531')} 150%)`,
                  }}
                >
                  {getValue('logo_url') ? (
                    <img src={getValue('logo_url')} alt="" className="h-12 w-12 rounded-lg object-contain bg-white/10 p-1" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white/80" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg">{getValue('nombre_display', 'Tu Club')}</p>
                    <p className="text-sm text-white/80">{getValue('slogan', 'Tu slogan aca')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipografia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipografia</CardTitle>
              <CardDescription>Fuentes para titulos y cuerpo del sitio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuente para titulos</Label>
                  <Select
                    value={getValue('fuente_titulos', 'Inter')}
                    onValueChange={(val) => setField('fuente_titulos', val ?? 'Inter')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuente para cuerpo</Label>
                  <Select
                    value={getValue('fuente_cuerpo', 'Inter')}
                    onValueChange={(val) => setField('fuente_cuerpo', val ?? 'Inter')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivos de marca */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Archivos de marca</CardTitle>
              <CardDescription>Logo, logo dark mode y favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FileUploadField
                  label="Logo principal"
                  tipo="logo"
                  currentUrl={getValue('logo_url')}
                  onUploaded={(url) => setField('logo_url', url)}
                />
                <FileUploadField
                  label="Logo dark mode"
                  tipo="logo_dark"
                  currentUrl={getValue('logo_dark_url')}
                  onUploaded={(url) => setField('logo_dark_url', url)}
                />
                <FileUploadField
                  label="Favicon"
                  tipo="favicon"
                  currentUrl={getValue('favicon_url')}
                  onUploaded={(url) => setField('favicon_url', url)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab 2: Contenido ============ */}
        <TabsContent value="contenido" className="mt-6 space-y-6">
          {/* Section builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secciones de la Home</CardTitle>
              <CardDescription>Activa y configura las secciones que aparecen en tu pagina principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {HOME_SECTIONS.map((section) => {
                const visKey = `seccion_${section.key}_visible`
                const isVisible = getBool(visKey, true)
                const isExpanded = expandedSections.has(section.key)
                const isPalmaresSection = section.key === 'palmares'

                return (
                  <div key={section.key} className="border rounded-lg">
                    {/* Section header */}
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(checked) => setField(visKey, checked)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{section.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => toggleExpanded(section.key)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Section content (expanded) */}
                    {isExpanded && (
                      <div className="border-t px-3 pb-3 pt-3 space-y-3 bg-muted/30">
                        {/* Regular fields */}
                        {section.fields.map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label htmlFor={field.key} className="text-xs">{field.label}</Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                id={field.key}
                                value={getValue(field.key)}
                                onChange={(e) => setField(field.key, e.target.value)}
                                rows={2}
                              />
                            ) : (
                              <Input
                                id={field.key}
                                value={getValue(field.key)}
                                onChange={(e) => setField(field.key, e.target.value)}
                              />
                            )}
                          </div>
                        ))}

                        {/* Palmares special editor */}
                        {isPalmaresSection && (
                          <div className="space-y-3">
                            {getPalmares().map((item, i) => (
                              <div key={i} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Anio</Label>
                                    <Input
                                      type="number"
                                      value={item.anio || ''}
                                      onChange={(e) => updatePalmares(i, 'anio', parseInt(e.target.value) || 0)}
                                      placeholder="2024"
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs">Titulo</Label>
                                    <Input
                                      value={item.titulo || ''}
                                      onChange={(e) => updatePalmares(i, 'titulo', e.target.value)}
                                      placeholder="Campeon Torneo Apertura"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Tipo</Label>
                                    <Input
                                      value={item.tipo || ''}
                                      onChange={(e) => updatePalmares(i, 'tipo', e.target.value)}
                                      placeholder="copa"
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-4">
                                    <Label className="text-xs">Descripcion</Label>
                                    <Input
                                      value={item.descripcion || ''}
                                      onChange={(e) => updatePalmares(i, 'descripcion', e.target.value)}
                                      placeholder="FACCMA - Junior +28"
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 mt-5"
                                  onClick={() => removePalmares(i)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addPalmares}>
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar trofeo
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Pagina Asociate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagina Asociate</CardTitle>
              <CardDescription>Textos de la pagina de asociacion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asociate_titulo">Titulo</Label>
                  <Input
                    id="asociate_titulo"
                    value={getValue('asociate_titulo')}
                    onChange={(e) => setField('asociate_titulo', e.target.value)}
                    placeholder="Asociate a Hindu Club"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asociate_bajada">Bajada</Label>
                  <Input
                    id="asociate_bajada"
                    value={getValue('asociate_bajada')}
                    onChange={(e) => setField('asociate_bajada', e.target.value)}
                    placeholder="Sumate a la familia Hindu"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asociate_descripcion">Descripcion</Label>
                <Textarea
                  id="asociate_descripcion"
                  value={getValue('asociate_descripcion')}
                  onChange={(e) => setField('asociate_descripcion', e.target.value)}
                  placeholder="Descripcion detallada de la seccion asociate..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab 3: Contacto ============ */}
        <TabsContent value="contacto" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de contacto</CardTitle>
              <CardDescription>Informacion de contacto visible en la pagina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_contacto">Email</Label>
                  <Input
                    id="email_contacto"
                    type="email"
                    value={getValue('email_contacto')}
                    onChange={(e) => setField('email_contacto', e.target.value)}
                    placeholder="info@hinduclub.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={getValue('telefono')}
                    onChange={(e) => setField('telefono', e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={getValue('whatsapp')}
                    onChange={(e) => setField('whatsapp', e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Direccion</Label>
                <Textarea
                  id="direccion"
                  value={getValue('direccion')}
                  onChange={(e) => setField('direccion', e.target.value)}
                  placeholder="Direccion del club..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapa_url">URL del mapa (Google Maps embed)</Label>
                <Input
                  id="mapa_url"
                  value={getValue('mapa_url')}
                  onChange={(e) => setField('mapa_url', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Redes sociales</CardTitle>
              <CardDescription>Links a las redes del club</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['instagram', 'facebook', 'twitter', 'youtube', 'tiktok'] as const).map((red) => (
                  <div key={red} className="space-y-2">
                    <Label htmlFor={`red_${red}`} className="capitalize">{red}</Label>
                    <Input
                      id={`red_${red}`}
                      value={getRedes()[red] || ''}
                      onChange={(e) => setRedSocial(red, e.target.value)}
                      placeholder={`https://${red}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab 4: Paginas ============ */}
        <TabsContent value="paginas" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paginas activas</CardTitle>
              <CardDescription>Elegi que paginas estan disponibles en tu sitio publico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  key: 'pagina_publica_activa',
                  label: 'Sitio publico',
                  desc: 'Habilita o deshabilita todo el sitio publico',
                },
                {
                  key: 'pre_inscripcion_activa',
                  label: 'Pre-inscripcion',
                  desc: 'Permite que nuevos interesados se pre-inscriban',
                },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={getBool(key)}
                    onCheckedChange={(checked) => setField(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibilidad en equipos</CardTitle>
              <CardDescription>Que se muestra en las paginas de cada equipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'mostrar_plantel', label: 'Plantel de jugadores' },
                { key: 'mostrar_staff', label: 'Cuerpo tecnico' },
                { key: 'mostrar_capitanes', label: 'Capitanes y subcapitanes' },
                { key: 'mostrar_calendario', label: 'Calendario y eventos' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium">{label}</Label>
                  <Switch
                    checked={getBool(key)}
                    onCheckedChange={(checked) => setField(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab 5: Legal ============ */}
        <TabsContent value="legal" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terminos y condiciones</CardTitle>
              <CardDescription>Texto legal que se muestra en el formulario de asociacion</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={getValue('terminos_condiciones')}
                onChange={(e) => setField('terminos_condiciones', e.target.value)}
                placeholder="Escribi los terminos y condiciones..."
                rows={12}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Politica de privacidad</CardTitle>
              <CardDescription>Texto sobre manejo de datos personales</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={getValue('politica_privacidad')}
                onChange={(e) => setField('politica_privacidad', e.target.value)}
                placeholder="Escribi la politica de privacidad..."
                rows={12}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab 6: Media ============ */}
        <TabsContent value="media" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biblioteca de imagenes</CardTitle>
              <CardDescription>Subi imagenes y asignalas a las diferentes secciones del sitio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader
                onUploaded={(url) => {
                  const media = [...getMedia(), { url, seccion: 'Sin asignar' }]
                  setField('media', media)
                }}
              />

              {getMedia().length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {getMedia().map((item, i) => (
                    <div key={i} className="relative group space-y-2">
                      <div className="relative">
                        <img
                          src={item.url}
                          alt={`Media ${i + 1}`}
                          className="h-28 w-full rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Select
                        value={item.seccion || 'Sin asignar'}
                        onValueChange={(val) => updateMediaTag(i, val ?? 'Sin asignar')}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_TAGS.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              {getMedia().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay imagenes cargadas. Usa el boton de arriba para subir.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Videos de YouTube</CardTitle>
              <CardDescription>URLs de videos para mostrar en la pagina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UrlListManager
                items={getArray('videos')}
                onChange={(items) => setField('videos', items)}
                placeholder="https://youtube.com/watch?v=..."
                label="video"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ======== Subcomponentes ========

function FileUploadField({
  label,
  tipo,
  currentUrl,
  onUploaded,
}: {
  label: string
  tipo: string
  currentUrl: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', tipo)
      const result = await uploadBrandingAsset(fd)
      if (result.ok && result.data?.url) {
        onUploaded(result.data.url)
        toast.success(`${label} subido`)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al subir archivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt={label}
            className="h-20 w-20 rounded-lg border object-contain bg-muted p-1"
          />
          <button
            type="button"
            onClick={() => onUploaded('')}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id={`upload-${tipo}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1.5" />
          )}
          {uploading ? 'Subiendo...' : 'Subir'}
        </Button>
      </div>
    </div>
  )
}

function MediaUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let count = 0
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('file', files[i])
        fd.append('tipo', `media_${Date.now()}_${i}`)
        const result = await uploadBrandingAsset(fd)
        if (result.ok && result.data?.url) {
          onUploaded(result.data.url)
          count++
        }
      }
      if (count > 0) {
        toast.success(`${count} imagen(es) subida(s)`)
      }
    } catch {
      toast.error('Error al subir imagenes')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
        id="upload-media"
      />
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arrastra imagenes o hace click para subir
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP hasta 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function UrlListManager({
  items,
  onChange,
  placeholder,
  label,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  label: string
}) {
  const [newUrl, setNewUrl] = useState('')

  function addUrl() {
    const trimmed = newUrl.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setNewUrl('')
  }

  function removeUrl(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={url} readOnly className="flex-1 text-sm" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeUrl(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addUrl()
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!newUrl.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">{items.length} {label}(s) agregado(s)</p>
      )}
    </div>
  )
}
