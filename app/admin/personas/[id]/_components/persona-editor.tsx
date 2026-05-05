'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, Download } from 'lucide-react'
import { editarPersona } from '../../_actions'
import type { EditarPersonaInput } from '../../_lib/schemas'
import { SeccionIdentidad } from './secciones/identidad'
import { SeccionContacto } from './secciones/contacto'
import { SeccionDireccion } from './secciones/direccion'
import { SeccionDeporteFisico } from './secciones/deporte-fisico'
import { SeccionDeporteActividad } from './secciones/deporte-actividad'
import { SeccionProfesional } from './secciones/profesional'
import { SeccionEducacion } from './secciones/educacion'
import { SeccionMembresia } from './secciones/membresia'
import { SeccionNotas } from './secciones/notas'
import { SeccionSalud } from './secciones/salud'
import { SeccionFichaTotal } from './secciones/ficha-total'
import { SeccionDocumentos } from './secciones/documentos'
import { TabAtributos } from './tab-atributos'
import { TabVinculos } from './tab-vinculos'
import { TabPadrones } from './tab-padrones'
import { ExportDialog } from './export-dialog'

interface PersonaEditorProps {
  persona: Record<string, unknown>
  catalogoAtributos: { slug: string; nombre: string; categoria: string }[]
  catalogoVinculos: { slug: string; nombre: string; categoria: string }[]
  padronesDisponibles: { id: string; nombre: string; slug: string; tipo: string }[]
  estadosPadron: { id: string; slug: string; nombre: string }[]
  tiposSocio: { id: string; slug: string; nombre: string }[]
}

function init(p: Record<string, unknown>): EditarPersonaInput {
  const s = (k: string) => (p[k] as string) ?? ''
  const b = (k: string) => (p[k] as boolean) ?? false
  const n = (k: string) => (p[k] as number) ?? undefined
  return {
    nombre: s('nombre'), apellido: s('apellido'), nombre_completo_legal: s('nombre_completo_legal'),
    tipo_documento: s('tipo_documento') || 'dni', numero_documento: s('numero_documento'),
    dni_pais_emision: s('dni_pais_emision') || 'AR', cuil_cuit: s('cuil_cuit'),
    pasaporte_numero: s('pasaporte_numero'), pasaporte_pais: s('pasaporte_pais'),
    pasaporte_vigencia: s('pasaporte_vigencia'), fecha_nacimiento: s('fecha_nacimiento'),
    genero: s('genero'), nacionalidad: s('nacionalidad') || 'AR', estado_civil: s('estado_civil'),
    foto_perfil_url: s('foto_perfil_url'),
    email_principal: s('email_principal'), email_secundario: s('email_secundario'),
    telefono_principal: s('telefono_principal'), telefono_secundario: s('telefono_secundario'),
    whatsapp: s('whatsapp'), whatsapp_emergencia: s('whatsapp_emergencia'),
    direccion_calle: s('direccion_calle'), direccion_numero: s('direccion_numero'),
    direccion_piso: s('direccion_piso'), direccion_depto: s('direccion_depto'),
    direccion_barrio: s('direccion_barrio'), direccion_ciudad: s('direccion_ciudad'),
    direccion_provincia: s('direccion_provincia'), direccion_codigo_postal: s('direccion_codigo_postal'),
    direccion_pais: s('direccion_pais') || 'AR', direccion_observaciones: s('direccion_observaciones'),
    lateralidad: s('lateralidad'), pie_dominante: s('pie_dominante'),
    mano_dominante: s('mano_dominante'), tipo_pisada: s('tipo_pisada'),
    altura_cm: n('altura_cm'), peso_kg: n('peso_kg'),
    fecha_medicion_fisica: s('fecha_medicion_fisica'), contextura: s('contextura'),
    usa_lentes: b('usa_lentes'), tipo_lentes: s('tipo_lentes'), usa_audifono: b('usa_audifono'),
    años_practica_deporte_principal: n('años_practica_deporte_principal'),
    deporte_principal_slug: s('deporte_principal_slug'),
    categoria_historica_max: s('categoria_historica_max'), nivel_actividad_actual: s('nivel_actividad_actual'),
    frecuencia_entrenamiento_semanal: n('frecuencia_entrenamiento_semanal'),
    horas_entrenamiento_semanales: n('horas_entrenamiento_semanales'),
    profesion_ocupacion: s('profesion_ocupacion'), categoria_profesional: s('categoria_profesional'),
    empresa_actual: s('empresa_actual'), cargo_actual: s('cargo_actual'),
    industria: s('industria'), sitio_web_profesional: s('sitio_web_profesional'),
    nivel_educativo_max: s('nivel_educativo_max'), titulo_carrera: s('titulo_carrera'),
    institucion_titulo: s('institucion_titulo'), año_graduacion: n('año_graduacion'),
    estudiando_actualmente: b('estudiando_actualmente'), institucion_actual: s('institucion_actual'),
    año_grado_actual: s('año_grado_actual'), idioma_nativo: s('idioma_nativo') || 'es',
    fecha_primera_relacion_club: s('fecha_primera_relacion_club'),
    es_socio_fundador: b('es_socio_fundador'), es_socio_vitalicio: b('es_socio_vitalicio'),
    es_socio_honorario: b('es_socio_honorario'), bautizo_club_realizado: b('bautizo_club_realizado'),
    notas_internas: s('notas_internas'),
  }
}

export function PersonaEditor({ persona, catalogoAtributos, catalogoVinculos, padronesDisponibles, estadosPadron, tiposSocio }: PersonaEditorProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EditarPersonaInput>(() => init(persona))
  const [exportOpen, setExportOpen] = useState(false)

  function update(field: keyof EditarPersonaInput, value: string | number | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  function s(field: keyof EditarPersonaInput) {
    return (form[field] as string) ?? ''
  }

  async function handleSubmit() {
    setLoading(true)
    const result = await editarPersona(persona.id as string, form)
    setLoading(false)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  const atributosActivos = (persona.personas_atributos as { activo: boolean }[] ?? []).filter((a) => a.activo).length

  return (
    <>
      <Tabs defaultValue="identidad">
        {/* ACTION BAR — sticky on mobile for easy access */}
        <div className="sticky top-[57px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-2 border-b sm:relative sm:top-auto sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:border-b-0 mb-3 sm:mb-0">
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <Download className="mr-2 h-3.5 w-3.5" />
              <span className="hidden xs:inline">Exportar</span>
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              Guardar cambios
            </Button>
          </div>
        </div>

        {/* TABS — horizontally scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:flex-wrap sm:w-auto h-auto gap-1">
            <TabsTrigger value="identidad">Identidad</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="direccion">Dirección</TabsTrigger>
            <TabsTrigger value="fisico">Físico</TabsTrigger>
            <TabsTrigger value="deporte">Deporte</TabsTrigger>
            <TabsTrigger value="salud">Salud</TabsTrigger>
            <TabsTrigger value="profesional">Profesional</TabsTrigger>
            <TabsTrigger value="educacion">Educación</TabsTrigger>
            <TabsTrigger value="membresia">Membresía</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
            <TabsTrigger value="roles">
              Roles
              {atributosActivos > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1 text-xs">
                  {atributosActivos}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
            <TabsTrigger value="padrones">Padrones</TabsTrigger>
            <TabsTrigger value="ficha">Ficha total</TabsTrigger>
          </TabsList>
        </div>

        {/* DATA SECTIONS — all share form state */}
        <TabsContent value="identidad" className="mt-4">
          <SeccionIdentidad form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="contacto" className="mt-4">
          <SeccionContacto form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="direccion" className="mt-4">
          <SeccionDireccion form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="fisico" className="mt-4">
          <SeccionDeporteFisico form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="deporte" className="mt-4">
          <SeccionDeporteActividad form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="salud" className="mt-4">
          <SeccionSalud personaId={persona.id as string} tenantId={persona.tenant_id as string} />
        </TabsContent>
        <TabsContent value="profesional" className="mt-4">
          <SeccionProfesional form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="educacion" className="mt-4">
          <SeccionEducacion form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="membresia" className="mt-4">
          <SeccionMembresia form={form} update={update} s={s} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <SeccionDocumentos personaId={persona.id as string} tenantId={persona.tenant_id as string} fotoPerfilUrl={(persona.foto_perfil_url as string) || undefined} />
        </TabsContent>
        <TabsContent value="notas" className="mt-4">
          <SeccionNotas form={form} update={update} s={s} />
        </TabsContent>

        {/* RELATIONSHIP TABS — independent state */}
        <TabsContent value="roles" className="mt-4">
          <TabAtributos
            personaId={persona.id as string}
            atributos={(persona.personas_atributos ?? []) as never[]}
            catalogo={catalogoAtributos}
          />
        </TabsContent>
        <TabsContent value="vinculos" className="mt-4">
          <TabVinculos
            personaId={persona.id as string}
            vinculosOrigen={(persona.personas_vinculos_origen ?? []) as never[]}
            vinculosDestino={(persona.personas_vinculos_destino ?? []) as never[]}
            catalogoVinculos={catalogoVinculos}
          />
        </TabsContent>
        <TabsContent value="padrones" className="mt-4">
          <TabPadrones
            personaId={persona.id as string}
            personaPadrones={(persona.personas_padrones ?? []) as never[]}
            padronesDisponibles={padronesDisponibles}
            estadosPadron={estadosPadron}
            tiposSocio={tiposSocio}
          />
        </TabsContent>

        {/* FICHA TOTAL — read-only overview */}
        <TabsContent value="ficha" className="mt-4">
          <SeccionFichaTotal form={form} persona={persona} />
        </TabsContent>
      </Tabs>

      <ExportDialog persona={persona} form={form} open={exportOpen} onOpenChange={setExportOpen} />
    </>
  )
}
