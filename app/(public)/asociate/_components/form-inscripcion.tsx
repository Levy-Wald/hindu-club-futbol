'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { crearPreInscripcion } from '../_actions'
import {
  User,
  Baby,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Circle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Categoria {
  id: string
  nombre_display: string
  edad_min: number | null
  edad_max: number | null
  disciplina_slug: string
}

interface FormData {
  es_menor: boolean | null
  nombre: string
  apellido: string
  fecha_nacimiento: string
  numero_documento: string
  sexo: string
  email: string
  telefono: string
  tutor_nombre: string
  tutor_apellido: string
  tutor_documento: string
  tutor_vinculo: string
  tutor_telefono: string
  tutor_email: string
  disciplina_slug: string
  categoria_preferida: string
  experiencia_previa: string
  mensaje: string
  acepta_terminos: boolean
  acepta_comunicaciones: boolean
}

const INITIAL_DATA: FormData = {
  es_menor: null,
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  numero_documento: '',
  sexo: '',
  email: '',
  telefono: '',
  tutor_nombre: '',
  tutor_apellido: '',
  tutor_documento: '',
  tutor_vinculo: '',
  tutor_telefono: '',
  tutor_email: '',
  disciplina_slug: 'futbol',
  categoria_preferida: '',
  experiencia_previa: '',
  mensaje: '',
  acepta_terminos: false,
  acepta_comunicaciones: false,
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function FormInscripcion({
  categorias,
  tenantId,
}: {
  categorias: Categoria[]
  tenantId: string
}) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Pasos dinamicos segun tipo de inscripcion
  const steps = buildSteps(data.es_menor)
  const totalSteps = steps.length
  const currentStepKey = steps[step]

  // Navegacion con Enter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) {
        // No avanzar si estamos en un textarea
        const target = e.target as HTMLElement
        if (target.tagName === 'TEXTAREA') return
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data])

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  function canAdvance(): boolean {
    switch (currentStepKey) {
      case 'tipo':
        return data.es_menor !== null
      case 'datos_personales':
        return data.nombre.trim() !== '' && data.apellido.trim() !== ''
      case 'contacto':
        return true
      case 'tutor':
        return (
          data.tutor_nombre.trim() !== '' &&
          data.tutor_apellido.trim() !== '' &&
          data.tutor_telefono.trim() !== ''
        )
      case 'deporte':
        return data.disciplina_slug !== ''
      case 'adicional':
        return true
      case 'confirmacion':
        return data.acepta_terminos
      default:
        return true
    }
  }

  function handleNext() {
    if (!canAdvance()) return
    if (step < totalSteps - 1) {
      setDirection('next')
      setStep((s) => s + 1)
    }
  }

  function handlePrev() {
    if (step > 0) {
      setDirection('prev')
      setStep((s) => s - 1)
    }
  }

  function handleSubmit() {
    if (!canAdvance()) return
    startTransition(async () => {
      const result = await crearPreInscripcion({
        tenant_id: tenantId,
        nombre: data.nombre,
        apellido: data.apellido,
        fecha_nacimiento: data.fecha_nacimiento || undefined,
        numero_documento: data.numero_documento || undefined,
        sexo: data.sexo || undefined,
        email: data.email || undefined,
        telefono: data.telefono || undefined,
        es_menor: data.es_menor ?? false,
        tutor_nombre: data.tutor_nombre || undefined,
        tutor_apellido: data.tutor_apellido || undefined,
        tutor_documento: data.tutor_documento || undefined,
        tutor_vinculo: data.tutor_vinculo || undefined,
        tutor_telefono: data.tutor_telefono || undefined,
        tutor_email: data.tutor_email || undefined,
        disciplina_slug: data.disciplina_slug || undefined,
        categoria_preferida: data.categoria_preferida || undefined,
        experiencia_previa: data.experiencia_previa || undefined,
        mensaje: data.mensaje || undefined,
        acepta_terminos: data.acepta_terminos,
        acepta_comunicaciones: data.acepta_comunicaciones,
      })
      if (result.ok) {
        setSubmitted(true)
      } else {
        toast.error(result.message)
      }
    })
  }

  // Pantalla de exito
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600 animate-in zoom-in-50 duration-500">
          <Check className="size-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground">
          Inscripcion enviada!
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          Recibimos tu solicitud. Nos vamos a poner en contacto con vos a la
          brevedad.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-8"
          onClick={() => (window.location.href = '/')}
        >
          Volver al inicio
        </Button>
      </div>
    )
  }

  const isLastStep = step === totalSteps - 1

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>
            Paso {step + 1} de {totalSteps}
          </span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3A8FC5] transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenido del paso */}
      <div
        key={currentStepKey}
        className={`animate-in duration-300 fill-mode-both ${
          direction === 'next'
            ? 'slide-in-from-right-4 fade-in-0'
            : 'slide-in-from-left-4 fade-in-0'
        }`}
      >
        {currentStepKey === 'tipo' && (
          <StepTipo value={data.es_menor} onChange={(v) => { update('es_menor', v); setDirection('next'); setTimeout(() => setStep((s) => s + 1), 300) }} />
        )}
        {currentStepKey === 'datos_personales' && (
          <StepDatosPersonales data={data} update={update} />
        )}
        {currentStepKey === 'contacto' && (
          <StepContacto data={data} update={update} />
        )}
        {currentStepKey === 'tutor' && (
          <StepTutor data={data} update={update} />
        )}
        {currentStepKey === 'deporte' && (
          <StepDeporte
            data={data}
            update={update}
            categorias={categorias}
          />
        )}
        {currentStepKey === 'adicional' && (
          <StepAdicional data={data} update={update} />
        )}
        {currentStepKey === 'confirmacion' && (
          <StepConfirmacion data={data} update={update} categorias={categorias} />
        )}
      </div>

      {/* Navegacion */}
      {currentStepKey !== 'tipo' && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Anterior
          </button>

          {isLastStep ? (
            <Button
              size="lg"
              className="bg-[#3A8FC5] hover:bg-[#3A8FC5]/90 text-white h-11 px-6"
              disabled={!canAdvance() || isPending}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Enviando...
                </>
              ) : (
                'Enviar inscripcion'
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-[#3A8FC5] hover:bg-[#3A8FC5]/90 text-white h-11 px-6"
              disabled={!canAdvance()}
              onClick={handleNext}
            >
              Siguiente
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StepKey =
  | 'tipo'
  | 'datos_personales'
  | 'contacto'
  | 'tutor'
  | 'deporte'
  | 'adicional'
  | 'confirmacion'

function buildSteps(esMenor: boolean | null): StepKey[] {
  const base: StepKey[] = ['tipo', 'datos_personales']
  if (esMenor === null) return base
  if (esMenor) {
    return [...base, 'tutor', 'deporte', 'adicional', 'confirmacion']
  }
  return [...base, 'contacto', 'deporte', 'adicional', 'confirmacion']
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepTipo({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Para quien es la inscripcion?
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Selecciona una opcion para continuar
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-[#3A8FC5] hover:shadow-md ${
            value === false
              ? 'border-[#3A8FC5] bg-[#3A8FC5]/5 shadow-md'
              : 'border-border'
          }`}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-[#3A8FC5]/10 text-[#3A8FC5]">
            <User className="size-7" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Para mi</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Soy mayor de 18 anios
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-[#3A8FC5] hover:shadow-md ${
            value === true
              ? 'border-[#3A8FC5] bg-[#3A8FC5]/5 shadow-md'
              : 'border-border'
          }`}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-[#F2C531]/10 text-[#F2C531]">
            <Baby className="size-7" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Para mi hijo/a</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Es menor de edad
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

function StepDatosPersonales({
  data,
  update,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        {data.es_menor ? 'Datos del/la menor' : 'Tus datos personales'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {data.es_menor
          ? 'Completa los datos de tu hijo/a'
          : 'Completa tus datos para la inscripcion'}
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              className="h-11"
              placeholder="Ej: Juan"
              value={data.nombre}
              onChange={(e) => update('nombre', e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              className="h-11"
              placeholder="Ej: Perez"
              value={data.apellido}
              onChange={(e) => update('apellido', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
          <Input
            id="fecha_nacimiento"
            type="date"
            className="h-11"
            value={data.fecha_nacimiento}
            onChange={(e) => update('fecha_nacimiento', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="numero_documento">Numero de documento</Label>
          <Input
            id="numero_documento"
            className="h-11"
            placeholder="Ej: 12345678"
            value={data.numero_documento}
            onChange={(e) => update('numero_documento', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Opcional, pero ayuda a agilizar el proceso
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Sexo</Label>
          <Select
            value={data.sexo}
            onValueChange={(v) => update('sexo', v ?? '')}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function StepContacto({
  data,
  update,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Datos de contacto
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Asi nos comunicamos con vos
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="h-11"
            placeholder="tu@email.com"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Telefono / WhatsApp</Label>
          <Input
            id="telefono"
            type="tel"
            className="h-11"
            placeholder="Ej: 11 2345-6789"
            value={data.telefono}
            onChange={(e) => update('telefono', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function StepTutor({
  data,
  update,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Datos del padre/madre/tutor
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Necesitamos los datos de un adulto responsable
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tutor_nombre">Nombre *</Label>
            <Input
              id="tutor_nombre"
              className="h-11"
              placeholder="Nombre del tutor"
              value={data.tutor_nombre}
              onChange={(e) => update('tutor_nombre', e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tutor_apellido">Apellido *</Label>
            <Input
              id="tutor_apellido"
              className="h-11"
              placeholder="Apellido del tutor"
              value={data.tutor_apellido}
              onChange={(e) => update('tutor_apellido', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tutor_documento">Documento</Label>
          <Input
            id="tutor_documento"
            className="h-11"
            placeholder="DNI del tutor"
            value={data.tutor_documento}
            onChange={(e) => update('tutor_documento', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Vinculo</Label>
          <Select
            value={data.tutor_vinculo}
            onValueChange={(v) => update('tutor_vinculo', v ?? '')}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar vinculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="padre">Padre</SelectItem>
              <SelectItem value="madre">Madre</SelectItem>
              <SelectItem value="tutor">Tutor/a</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tutor_telefono">Telefono / WhatsApp *</Label>
          <Input
            id="tutor_telefono"
            type="tel"
            className="h-11"
            placeholder="Ej: 11 2345-6789"
            value={data.tutor_telefono}
            onChange={(e) => update('tutor_telefono', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tutor_email">Email</Label>
          <Input
            id="tutor_email"
            type="email"
            className="h-11"
            placeholder="email@ejemplo.com"
            value={data.tutor_email}
            onChange={(e) => update('tutor_email', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function StepDeporte({
  data,
  update,
  categorias,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  categorias: Categoria[]
}) {
  const categoriasFutbol = categorias.filter(
    (c) => c.disciplina_slug === 'futbol'
  )

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Que deporte te interesa?
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Selecciona la disciplina y la categoria
      </p>

      <div className="space-y-6">
        {/* Disciplina */}
        <div>
          <Label className="mb-2">Disciplina</Label>
          <button
            type="button"
            onClick={() => update('disciplina_slug', 'futbol')}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all hover:border-[#3A8FC5] ${
              data.disciplina_slug === 'futbol'
                ? 'border-[#3A8FC5] bg-[#3A8FC5]/5'
                : 'border-border'
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-[#3A8FC5]/10 text-[#3A8FC5]">
              <Circle className="size-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Futbol</p>
              <p className="text-xs text-muted-foreground">
                Futbol 11 - Todas las categorias
              </p>
            </div>
          </button>
        </div>

        {/* Categoria */}
        {categoriasFutbol.length > 0 && (
          <div className="space-y-1.5">
            <Label>Categoria preferida</Label>
            <Select
              value={data.categoria_preferida}
              onValueChange={(v) => update('categoria_preferida', v ?? '')}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFutbol.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre_display}
                    {c.edad_min != null && c.edad_max != null
                      ? ` (${c.edad_min}-${c.edad_max} anios)`
                      : c.edad_min != null
                        ? ` (desde ${c.edad_min} anios)`
                        : c.edad_max != null
                          ? ` (hasta ${c.edad_max} anios)`
                          : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si no estas seguro, no te preocupes. Te ayudamos a elegir.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StepAdicional({
  data,
  update,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Algo mas que quieras contarnos?
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Este paso es opcional
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="experiencia_previa">Experiencia previa</Label>
          <Textarea
            id="experiencia_previa"
            className="min-h-24"
            placeholder="Jugaste en algun club? Contanos tu experiencia..."
            value={data.experiencia_previa}
            onChange={(e) => update('experiencia_previa', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mensaje">Mensaje adicional</Label>
          <Textarea
            id="mensaje"
            className="min-h-24"
            placeholder="Algo mas que quieras decirnos?"
            value={data.mensaje}
            onChange={(e) => update('mensaje', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function StepConfirmacion({
  data,
  update,
  categorias,
}: {
  data: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  categorias: Categoria[]
}) {
  const categoriaLabel =
    categorias.find((c) => c.id === data.categoria_preferida)
      ?.nombre_display ?? '-'

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Revisa tus datos
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Confirma que todo este correcto antes de enviar
      </p>

      {/* Resumen */}
      <div className="rounded-xl border border-border divide-y divide-border text-sm">
        <SummaryRow label="Tipo" value={data.es_menor ? 'Menor de edad' : 'Mayor de edad'} />
        <SummaryRow label="Nombre" value={`${data.nombre} ${data.apellido}`} />
        {data.fecha_nacimiento && (
          <SummaryRow label="Fecha de nacimiento" value={formatDate(data.fecha_nacimiento)} />
        )}
        {data.numero_documento && (
          <SummaryRow label="Documento" value={data.numero_documento} />
        )}
        {data.sexo && (
          <SummaryRow label="Sexo" value={data.sexo} />
        )}

        {!data.es_menor && (data.email || data.telefono) && (
          <>
            {data.email && <SummaryRow label="Email" value={data.email} />}
            {data.telefono && <SummaryRow label="Telefono" value={data.telefono} />}
          </>
        )}

        {data.es_menor && (
          <>
            <SummaryRow
              label="Tutor"
              value={`${data.tutor_nombre} ${data.tutor_apellido}${data.tutor_vinculo ? ` (${data.tutor_vinculo})` : ''}`}
            />
            {data.tutor_telefono && (
              <SummaryRow label="Tel. tutor" value={data.tutor_telefono} />
            )}
            {data.tutor_email && (
              <SummaryRow label="Email tutor" value={data.tutor_email} />
            )}
          </>
        )}

        <SummaryRow label="Deporte" value="Futbol" />
        {data.categoria_preferida && (
          <SummaryRow label="Categoria" value={categoriaLabel} />
        )}
      </div>

      {/* Checkboxes */}
      <div className="mt-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={data.acepta_terminos}
            onCheckedChange={(v) => update('acepta_terminos', v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">
            Acepto los{' '}
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3A8FC5] underline underline-offset-2 hover:text-[#3A8FC5]/80"
            >
              terminos y condiciones
            </a>{' '}
            *
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={data.acepta_comunicaciones}
            onCheckedChange={(v) =>
              update('acepta_comunicaciones', v === true)
            }
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground">
            Acepto recibir comunicaciones del club
          </span>
        </label>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Micro-components
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  } catch {
    return iso
  }
}
