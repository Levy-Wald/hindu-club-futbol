'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { editarPersona } from '../../_actions'
import type { EditarPersonaInput } from '../../_lib/schemas'

// Provincias argentinas
const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
]

const PAISES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'PE', label: 'Perú' },
  { value: 'CO', label: 'Colombia' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'MX', label: 'México' },
  { value: 'ES', label: 'España' },
  { value: 'IT', label: 'Italia' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Alemania' },
  { value: 'OTRO', label: 'Otro' },
]

const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Alemán' },
  { value: 'otro', label: 'Otro' },
]

const DEPORTES = [
  { value: 'hockey', label: 'Hockey' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'futbol', label: 'Fútbol' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Pádel' },
  { value: 'natacion', label: 'Natación' },
  { value: 'golf', label: 'Golf' },
  { value: 'squash', label: 'Squash' },
  { value: 'voley', label: 'Vóley' },
  { value: 'basket', label: 'Básquet' },
  { value: 'atletismo', label: 'Atletismo' },
  { value: 'polo', label: 'Polo' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'softbol', label: 'Softbol' },
  { value: 'otro', label: 'Otro' },
]

interface TabDatosProps {
  persona: Record<string, unknown>
}

export function TabDatos({ persona }: TabDatosProps) {
  const [loading, setLoading] = useState(false)
  const p = persona

  const [form, setForm] = useState<EditarPersonaInput>({
    nombre: (p.nombre as string) ?? '',
    apellido: (p.apellido as string) ?? '',
    nombre_completo_legal: (p.nombre_completo_legal as string) ?? '',
    tipo_documento: (p.tipo_documento as string) ?? 'dni',
    numero_documento: (p.numero_documento as string) ?? '',
    dni_pais_emision: (p.dni_pais_emision as string) ?? 'AR',
    cuil_cuit: (p.cuil_cuit as string) ?? '',
    pasaporte_numero: (p.pasaporte_numero as string) ?? '',
    pasaporte_pais: (p.pasaporte_pais as string) ?? '',
    pasaporte_vigencia: (p.pasaporte_vigencia as string) ?? '',
    fecha_nacimiento: (p.fecha_nacimiento as string) ?? '',
    genero: (p.genero as string) ?? '',
    nacionalidad: (p.nacionalidad as string) ?? 'AR',
    estado_civil: (p.estado_civil as string) ?? '',
    foto_perfil_url: (p.foto_perfil_url as string) ?? '',
    email_principal: (p.email_principal as string) ?? '',
    email_secundario: (p.email_secundario as string) ?? '',
    telefono_principal: (p.telefono_principal as string) ?? '',
    telefono_secundario: (p.telefono_secundario as string) ?? '',
    whatsapp: (p.whatsapp as string) ?? '',
    whatsapp_emergencia: (p.whatsapp_emergencia as string) ?? '',
    direccion_calle: (p.direccion_calle as string) ?? '',
    direccion_numero: (p.direccion_numero as string) ?? '',
    direccion_piso: (p.direccion_piso as string) ?? '',
    direccion_depto: (p.direccion_depto as string) ?? '',
    direccion_barrio: (p.direccion_barrio as string) ?? '',
    direccion_ciudad: (p.direccion_ciudad as string) ?? '',
    direccion_provincia: (p.direccion_provincia as string) ?? '',
    direccion_codigo_postal: (p.direccion_codigo_postal as string) ?? '',
    direccion_pais: (p.direccion_pais as string) ?? 'AR',
    direccion_observaciones: (p.direccion_observaciones as string) ?? '',
    lateralidad: (p.lateralidad as string) ?? '',
    pie_dominante: (p.pie_dominante as string) ?? '',
    mano_dominante: (p.mano_dominante as string) ?? '',
    tipo_pisada: (p.tipo_pisada as string) ?? '',
    altura_cm: (p.altura_cm as number) ?? undefined,
    peso_kg: (p.peso_kg as number) ?? undefined,
    fecha_medicion_fisica: (p.fecha_medicion_fisica as string) ?? '',
    contextura: (p.contextura as string) ?? '',
    usa_lentes: (p.usa_lentes as boolean) ?? false,
    tipo_lentes: (p.tipo_lentes as string) ?? '',
    usa_audifono: (p.usa_audifono as boolean) ?? false,
    años_practica_deporte_principal: (p.años_practica_deporte_principal as number) ?? undefined,
    deporte_principal_slug: (p.deporte_principal_slug as string) ?? '',
    categoria_historica_max: (p.categoria_historica_max as string) ?? '',
    nivel_actividad_actual: (p.nivel_actividad_actual as string) ?? '',
    frecuencia_entrenamiento_semanal: (p.frecuencia_entrenamiento_semanal as number) ?? undefined,
    horas_entrenamiento_semanales: (p.horas_entrenamiento_semanales as number) ?? undefined,
    profesion_ocupacion: (p.profesion_ocupacion as string) ?? '',
    categoria_profesional: (p.categoria_profesional as string) ?? '',
    empresa_actual: (p.empresa_actual as string) ?? '',
    cargo_actual: (p.cargo_actual as string) ?? '',
    industria: (p.industria as string) ?? '',
    sitio_web_profesional: (p.sitio_web_profesional as string) ?? '',
    nivel_educativo_max: (p.nivel_educativo_max as string) ?? '',
    titulo_carrera: (p.titulo_carrera as string) ?? '',
    institucion_titulo: (p.institucion_titulo as string) ?? '',
    año_graduacion: (p.año_graduacion as number) ?? undefined,
    estudiando_actualmente: (p.estudiando_actualmente as boolean) ?? false,
    institucion_actual: (p.institucion_actual as string) ?? '',
    año_grado_actual: (p.año_grado_actual as string) ?? '',
    idioma_nativo: (p.idioma_nativo as string) ?? 'es',
    fecha_primera_relacion_club: (p.fecha_primera_relacion_club as string) ?? '',
    es_socio_fundador: (p.es_socio_fundador as boolean) ?? false,
    es_socio_vitalicio: (p.es_socio_vitalicio as boolean) ?? false,
    es_socio_honorario: (p.es_socio_honorario as boolean) ?? false,
    bautizo_club_realizado: (p.bautizo_club_realizado as boolean) ?? false,
    notas_internas: (p.notas_internas as string) ?? '',
  })

  function update(field: keyof EditarPersonaInput, value: string | number | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  function s(field: keyof EditarPersonaInput) {
    return (form[field] as string) ?? ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await editarPersona(persona.id as string, form)
    setLoading(false)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* STICKY SAVE */}
      <div className="sticky top-14 z-10 flex justify-end bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-1 px-1 border-b">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      {/* ═══════════════════ IDENTIDAD ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identidad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Nombre *">
              <Input value={s('nombre')} onChange={(e) => update('nombre', e.target.value)} required />
            </Field>
            <Field label="Apellido *">
              <Input value={s('apellido')} onChange={(e) => update('apellido', e.target.value)} required />
            </Field>
            <Field label="Nombre legal completo">
              <Input value={s('nombre_completo_legal')} onChange={(e) => update('nombre_completo_legal', e.target.value)} placeholder="Si difiere del nombre + apellido" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Tipo documento *">
              <Select value={s('tipo_documento')} onValueChange={(v) => update('tipo_documento', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="pasaporte">Pasaporte</SelectItem>
                  <SelectItem value="cedula">Cédula</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nro. documento *">
              <Input value={s('numero_documento')} onChange={(e) => update('numero_documento', e.target.value)} required />
            </Field>
            <Field label="País emisión doc.">
              <Select value={s('dni_pais_emision') || 'AR'} onValueChange={(v) => update('dni_pais_emision', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="CUIL/CUIT">
              <Input value={s('cuil_cuit')} onChange={(e) => update('cuil_cuit', e.target.value)} placeholder="20-12345678-9" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Pasaporte nro.">
              <Input value={s('pasaporte_numero')} onChange={(e) => update('pasaporte_numero', e.target.value)} />
            </Field>
            <Field label="Pasaporte país">
              <Select value={s('pasaporte_pais') || ''} onValueChange={(v) => update('pasaporte_pais', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Pasaporte vigencia">
              <Input type="date" value={s('pasaporte_vigencia')} onChange={(e) => update('pasaporte_vigencia', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Fecha nacimiento">
              <Input type="date" value={s('fecha_nacimiento')} onChange={(e) => update('fecha_nacimiento', e.target.value)} />
            </Field>
            <Field label="Género">
              <Select value={s('genero')} onValueChange={(v) => update('genero', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="no_binario">No binario</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="prefiere_no_decir">Prefiere no decir</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nacionalidad">
              <Select value={s('nacionalidad') || 'AR'} onValueChange={(v) => update('nacionalidad', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Estado civil">
              <Select value={s('estado_civil')} onValueChange={(v) => update('estado_civil', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soltero">Soltero/a</SelectItem>
                  <SelectItem value="casado">Casado/a</SelectItem>
                  <SelectItem value="divorciado">Divorciado/a</SelectItem>
                  <SelectItem value="viudo">Viudo/a</SelectItem>
                  <SelectItem value="en_pareja">En pareja</SelectItem>
                  <SelectItem value="conviviente">Conviviente</SelectItem>
                  <SelectItem value="separado">Separado/a</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ CONTACTO ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email principal">
              <Input type="email" value={s('email_principal')} onChange={(e) => update('email_principal', e.target.value)} placeholder="nombre@ejemplo.com" />
            </Field>
            <Field label="Email secundario">
              <Input type="email" value={s('email_secundario')} onChange={(e) => update('email_secundario', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Teléfono principal">
              <Input type="tel" value={s('telefono_principal')} onChange={(e) => update('telefono_principal', e.target.value)} placeholder="+54 11 1234-5678" />
            </Field>
            <Field label="Teléfono secundario">
              <Input type="tel" value={s('telefono_secundario')} onChange={(e) => update('telefono_secundario', e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <Input type="tel" value={s('whatsapp')} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+54 11 1234-5678" />
            </Field>
            <Field label="WhatsApp emergencia">
              <Input type="tel" value={s('whatsapp_emergencia')} onChange={(e) => update('whatsapp_emergencia', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ DIRECCIÓN ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dirección</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            <Field label="Calle" className="sm:col-span-3">
              <Input value={s('direccion_calle')} onChange={(e) => update('direccion_calle', e.target.value)} />
            </Field>
            <Field label="Número">
              <Input value={s('direccion_numero')} onChange={(e) => update('direccion_numero', e.target.value)} />
            </Field>
            <Field label="Piso">
              <Input value={s('direccion_piso')} onChange={(e) => update('direccion_piso', e.target.value)} />
            </Field>
            <Field label="Depto">
              <Input value={s('direccion_depto')} onChange={(e) => update('direccion_depto', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Barrio">
              <Input value={s('direccion_barrio')} onChange={(e) => update('direccion_barrio', e.target.value)} />
            </Field>
            <Field label="Ciudad">
              <Input value={s('direccion_ciudad')} onChange={(e) => update('direccion_ciudad', e.target.value)} />
            </Field>
            <Field label="Provincia">
              <Select value={s('direccion_provincia')} onValueChange={(v) => update('direccion_provincia', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PROVINCIAS.map((prov) => <SelectItem key={prov} value={prov}>{prov}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Código postal">
              <Input value={s('direccion_codigo_postal')} onChange={(e) => update('direccion_codigo_postal', e.target.value)} placeholder="1234" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="País">
              <Select value={s('direccion_pais') || 'AR'} onValueChange={(v) => update('direccion_pais', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Observaciones">
              <Input value={s('direccion_observaciones')} onChange={(e) => update('direccion_observaciones', e.target.value)} placeholder="Ej: entre calles, referencia..." />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ PERFIL DEPORTIVO ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Perfil deportivo — Físico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Altura (cm)">
              <Input type="number" min={50} max={250} value={form.altura_cm ?? ''} onChange={(e) => update('altura_cm', e.target.valueAsNumber || 0)} placeholder="175" />
            </Field>
            <Field label="Peso (kg)">
              <Input type="number" min={20} max={300} step="0.1" value={form.peso_kg ?? ''} onChange={(e) => update('peso_kg', e.target.valueAsNumber || 0)} placeholder="72.5" />
            </Field>
            <Field label="Fecha medición">
              <Input type="date" value={s('fecha_medicion_fisica')} onChange={(e) => update('fecha_medicion_fisica', e.target.value)} />
            </Field>
            <Field label="Contextura">
              <Select value={s('contextura')} onValueChange={(v) => update('contextura', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeña">Pequeña</SelectItem>
                  <SelectItem value="mediana">Mediana</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                  <SelectItem value="atletica">Atlética</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Lateralidad">
              <Select value={s('lateralidad')} onValueChange={(v) => update('lateralidad', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zurdo">Zurdo</SelectItem>
                  <SelectItem value="derecho">Derecho</SelectItem>
                  <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pie dominante">
              <Select value={s('pie_dominante')} onValueChange={(v) => update('pie_dominante', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="izquierdo">Izquierdo</SelectItem>
                  <SelectItem value="derecho">Derecho</SelectItem>
                  <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mano dominante">
              <Select value={s('mano_dominante')} onValueChange={(v) => update('mano_dominante', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="izquierda">Izquierda</SelectItem>
                  <SelectItem value="derecha">Derecha</SelectItem>
                  <SelectItem value="ambidiestra">Ambidiestra</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo pisada">
              <Select value={s('tipo_pisada')} onValueChange={(v) => update('tipo_pisada', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pronador">Pronador</SelectItem>
                  <SelectItem value="supinador">Supinador</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="desconocido">Desconocido</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="usa_lentes" checked={form.usa_lentes ?? false} onCheckedChange={(v) => update('usa_lentes', v === true)} />
              <Label htmlFor="usa_lentes" className="cursor-pointer text-sm">Usa lentes</Label>
            </div>
            <Field label="Tipo lentes">
              <Select value={s('tipo_lentes')} onValueChange={(v) => update('tipo_lentes', v)} disabled={!form.usa_lentes}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recetados">Recetados</SelectItem>
                  <SelectItem value="contacto">De contacto</SelectItem>
                  <SelectItem value="deportivos">Deportivos</SelectItem>
                  <SelectItem value="sol_recetados">Sol con receta</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="usa_audifono" checked={form.usa_audifono ?? false} onCheckedChange={(v) => update('usa_audifono', v === true)} />
              <Label htmlFor="usa_audifono" className="cursor-pointer text-sm">Usa audífono</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════���════════ ACTIVIDAD DEPORTIVA ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Perfil deportivo — Actividad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Deporte principal">
              <Select value={s('deporte_principal_slug')} onValueChange={(v) => update('deporte_principal_slug', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{DEPORTES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Años de práctica">
              <Input type="number" min={0} max={60} value={form.años_practica_deporte_principal ?? ''} onChange={(e) => update('años_practica_deporte_principal', e.target.valueAsNumber || 0)} />
            </Field>
            <Field label="Categoría histórica máx.">
              <Select value={s('categoria_historica_max')} onValueChange={(v) => update('categoria_historica_max', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recreativo">Recreativo</SelectItem>
                  <SelectItem value="federado">Federado</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="seleccion">Selección</SelectItem>
                  <SelectItem value="olimpico">Olímpico</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nivel actividad actual">
              <Select value={s('nivel_actividad_actual')} onValueChange={(v) => update('nivel_actividad_actual', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentario</SelectItem>
                  <SelectItem value="ligero">Ligero</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="atleta">Atleta</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Entrenamientos por semana">
              <Input type="number" min={0} max={14} value={form.frecuencia_entrenamiento_semanal ?? ''} onChange={(e) => update('frecuencia_entrenamiento_semanal', e.target.valueAsNumber || 0)} />
            </Field>
            <Field label="Horas por semana">
              <Input type="number" min={0} max={50} step="0.5" value={form.horas_entrenamiento_semanales ?? ''} onChange={(e) => update('horas_entrenamiento_semanales', e.target.valueAsNumber || 0)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ════════════���══════ PROFESIONAL ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profesional</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Profesión / Ocupación">
              <Input value={s('profesion_ocupacion')} onChange={(e) => update('profesion_ocupacion', e.target.value)} placeholder="Ej: Contador, Ingeniero..." />
            </Field>
            <Field label="Categoría profesional">
              <Select value={s('categoria_profesional')} onValueChange={(v) => update('categoria_profesional', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="autonomo">Autónomo</SelectItem>
                  <SelectItem value="empresario">Empresario</SelectItem>
                  <SelectItem value="profesional_independiente">Profesional independiente</SelectItem>
                  <SelectItem value="jubilado">Jubilado</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                  <SelectItem value="ama_de_casa">Ama de casa</SelectItem>
                  <SelectItem value="sin_actividad">Sin actividad</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Empresa actual">
              <Input value={s('empresa_actual')} onChange={(e) => update('empresa_actual', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Cargo">
              <Input value={s('cargo_actual')} onChange={(e) => update('cargo_actual', e.target.value)} />
            </Field>
            <Field label="Industria">
              <Input value={s('industria')} onChange={(e) => update('industria', e.target.value)} placeholder="Ej: Tecnología, Salud..." />
            </Field>
            <Field label="Sitio web profesional">
              <Input type="url" value={s('sitio_web_profesional')} onChange={(e) => update('sitio_web_profesional', e.target.value)} placeholder="https://..." />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ EDUCACIÓN ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Educación</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Nivel educativo máximo">
              <Select value={s('nivel_educativo_max')} onValueChange={(v) => update('nivel_educativo_max', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primaria_incompleta">Primaria incompleta</SelectItem>
                  <SelectItem value="primaria">Primaria completa</SelectItem>
                  <SelectItem value="secundaria_incompleta">Secundaria incompleta</SelectItem>
                  <SelectItem value="secundaria">Secundaria completa</SelectItem>
                  <SelectItem value="terciario_incompleto">Terciario incompleto</SelectItem>
                  <SelectItem value="terciario">Terciario completo</SelectItem>
                  <SelectItem value="universitario_incompleto">Universitario incompleto</SelectItem>
                  <SelectItem value="universitario">Universitario completo</SelectItem>
                  <SelectItem value="posgrado">Posgrado</SelectItem>
                  <SelectItem value="doctorado">Doctorado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Título / Carrera">
              <Input value={s('titulo_carrera')} onChange={(e) => update('titulo_carrera', e.target.value)} placeholder="Ej: Lic. en Administración" />
            </Field>
            <Field label="Institución">
              <Input value={s('institucion_titulo')} onChange={(e) => update('institucion_titulo', e.target.value)} placeholder="Ej: UBA, ITBA..." />
            </Field>
            <Field label="Año graduación">
              <Input type="number" min={1950} max={2030} value={form.año_graduacion ?? ''} onChange={(e) => update('año_graduacion', e.target.valueAsNumber || 0)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="estudiando_actualmente" checked={form.estudiando_actualmente ?? false} onCheckedChange={(v) => update('estudiando_actualmente', v === true)} />
              <Label htmlFor="estudiando_actualmente" className="cursor-pointer text-sm">Estudia actualmente</Label>
            </div>
            <Field label="Institución actual">
              <Input value={s('institucion_actual')} onChange={(e) => update('institucion_actual', e.target.value)} disabled={!form.estudiando_actualmente} />
            </Field>
            <Field label="Año/grado cursando">
              <Input value={s('año_grado_actual')} onChange={(e) => update('año_grado_actual', e.target.value)} disabled={!form.estudiando_actualmente} placeholder="Ej: 3er año" />
            </Field>
            <Field label="Idioma nativo">
              <Select value={s('idioma_nativo') || 'es'} onValueChange={(v) => update('idioma_nativo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IDIOMAS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ MEMBRESÍA ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Membresía club</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primera relación con el club">
              <Input type="date" value={s('fecha_primera_relacion_club')} onChange={(e) => update('fecha_primera_relacion_club', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="es_socio_fundador" checked={form.es_socio_fundador ?? false} onCheckedChange={(v) => update('es_socio_fundador', v === true)} />
              <Label htmlFor="es_socio_fundador" className="cursor-pointer text-sm">Fundador</Label>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="es_socio_vitalicio" checked={form.es_socio_vitalicio ?? false} onCheckedChange={(v) => update('es_socio_vitalicio', v === true)} />
              <Label htmlFor="es_socio_vitalicio" className="cursor-pointer text-sm">Vitalicio</Label>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="es_socio_honorario" checked={form.es_socio_honorario ?? false} onCheckedChange={(v) => update('es_socio_honorario', v === true)} />
              <Label htmlFor="es_socio_honorario" className="cursor-pointer text-sm">Honorario</Label>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox id="bautizo_club_realizado" checked={form.bautizo_club_realizado ?? false} onCheckedChange={(v) => update('bautizo_club_realizado', v === true)} />
              <Label htmlFor="bautizo_club_realizado" className="cursor-pointer text-sm">Bautizo</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ NOTAS ═══════════════════ */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={s('notas_internas')}
            onChange={(e) => update('notas_internas', e.target.value)}
            rows={4}
            placeholder="Notas visibles solo para administradores del sistema..."
          />
        </CardContent>
      </Card>
    </form>
  )
}

// Helper component para reducir repetición
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
