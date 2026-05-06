'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, User, ExternalLink } from 'lucide-react'
import { crearContrato } from '@/app/admin/rrhh/_actions'
import { buscarPersonasRRHH, fetchDatosLaborales } from '@/app/admin/rrhh/_lib/queries'
import { toast } from 'sonner'
import Link from 'next/link'

interface DatosLaborales {
  area_trabajo_slug: string | null
  puesto_slug: string | null
  rol_laboral_slug: string | null
  numero_legajo: string | null
  obra_social_slug: string | null
  sindicato: string | null
  area?: { slug: string; nombre: string }[] | null
  puesto?: { slug: string; nombre: string }[] | null
  rol?: { slug: string; nombre: string }[] | null
  obra_social?: { slug: string; nombre: string }[] | null
}

interface PersonaResult {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  cuil_cuit: string | null
}

export function NuevoContratoDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Persona search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null)
  const [datosLaborales, setDatosLaborales] = useState<DatosLaborales | null>(null)
  const [loadingDatos, setLoadingDatos] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Contract fields
  const [modalidad, setModalidad] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [frecuencia, setFrecuencia] = useState('mensual')

  function resetForm() {
    setSearchQuery('')
    setSearchResults([])
    setSelectedPersona(null)
    setDatosLaborales(null)
    setModalidad('')
    setFechaInicio('')
    setFechaFin('')
    setMonto('')
    setMoneda('ARS')
    setFrecuencia('mensual')
  }

  // Search personas with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const results = await buscarPersonasRRHH(searchQuery)
      setSearchResults(results)
      setShowResults(true)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [searchQuery])

  // Load datos laborales when persona selected
  async function handleSelectPersona(persona: PersonaResult) {
    setSelectedPersona(persona)
    setSearchQuery('')
    setShowResults(false)
    setLoadingDatos(true)
    const datos = await fetchDatosLaborales(persona.id)
    setDatosLaborales(datos)
    setLoadingDatos(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPersona) {
      toast.error('Seleccione una persona')
      return
    }

    const formData = new FormData()
    formData.set('persona_id', selectedPersona.id)
    formData.set('modalidad', modalidad)
    formData.set('fecha_inicio', fechaInicio)
    if (fechaFin) formData.set('fecha_fin', fechaFin)
    formData.set('monto', monto)
    formData.set('moneda', moneda)
    formData.set('frecuencia', frecuencia)

    startTransition(async () => {
      const result = await crearContrato(formData)
      if (result.success) {
        toast.success('Contrato creado correctamente')
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al crear contrato')
      }
    })
  }

  // Helper to get FK join name (PostgREST returns array)
  function fkName(fkArr: { slug: string; nombre: string }[] | null | undefined): string {
    if (!fkArr) return '-'
    const item = Array.isArray(fkArr) ? fkArr[0] : fkArr
    return item?.nombre ?? '-'
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nuevo contrato
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Persona autocomplete */}
          <div className="space-y-1">
            <Label>Persona *</Label>
            {selectedPersona ? (
              <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {selectedPersona.apellido}, {selectedPersona.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPersona.numero_documento && `DNI ${selectedPersona.numero_documento}`}
                    {selectedPersona.cuil_cuit && ` · CUIL ${selectedPersona.cuil_cuit}`}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedPersona(null); setDatosLaborales(null) }}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Buscar por nombre, apellido o DNI..."
                  className="pl-9"
                  autoFocus
                />
                {showResults && searchResults.length > 0 && (
                  <div ref={resultsRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                        onMouseDown={() => handleSelectPersona(p)}
                      >
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{p.apellido}, {p.nombre}</span>
                        {p.numero_documento && (
                          <span className="text-muted-foreground ml-auto text-xs">DNI {p.numero_documento}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">
                    No se encontraron personas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Datos laborales read-only */}
          {selectedPersona && (
            <div className="rounded-md border p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Datos laborales de la persona</p>
                <Link
                  href={`/admin/personas/${selectedPersona.id}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {datosLaborales ? 'Editar ficha' : 'Completar ficha'}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              {loadingDatos ? (
                <p className="text-xs text-muted-foreground">Cargando...</p>
              ) : datosLaborales ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p>{fkName(datosLaborales.area)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Puesto</p>
                    <p>{fkName(datosLaborales.puesto)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rol</p>
                    <p>{fkName(datosLaborales.rol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Legajo</p>
                    <p>{datosLaborales.numero_legajo ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CUIL</p>
                    <p>{selectedPersona.cuil_cuit ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Obra social</p>
                    <p>{fkName(datosLaborales.obra_social)}</p>
                  </div>
                  {datosLaborales.sindicato && (
                    <div>
                      <p className="text-xs text-muted-foreground">Sindicato</p>
                      <p>{datosLaborales.sindicato}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  Esta persona no tiene datos laborales cargados.{' '}
                  <Link href={`/admin/personas/${selectedPersona.id}`} target="_blank" className="underline font-medium">
                    Completar ficha de {selectedPersona.nombre}
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Contract fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Modalidad */}
            <div className="space-y-1">
              <Label>Modalidad *</Label>
              <Select value={modalidad} onValueChange={(v) => setModalidad(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relacion_dependencia">Rel. dependencia</SelectItem>
                  <SelectItem value="monotributo">Monotributo</SelectItem>
                  <SelectItem value="honorarios">Honorarios</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                  <SelectItem value="pasantia">Pasantia</SelectItem>
                  <SelectItem value="voluntariado">Voluntariado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div className="space-y-1">
              <Label>Fecha inicio *</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            {/* Fecha fin */}
            <div className="space-y-1">
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Dejar vacio = indefinido</p>
            </div>

            {/* Monto */}
            <div className="space-y-1">
              <Label>Monto *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Moneda */}
            <div className="space-y-1">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={(v) => setMoneda(v ?? 'ARS')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frecuencia */}
            <div className="space-y-1">
              <Label>Frecuencia</Label>
              <Select value={frecuencia} onValueChange={(v) => setFrecuencia(v ?? 'mensual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="por_hora">Por hora</SelectItem>
                  <SelectItem value="por_evento">Por evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !selectedPersona}>
              {isPending ? 'Creando...' : 'Crear contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
