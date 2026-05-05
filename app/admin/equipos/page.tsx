import { fetchEquipos, fetchCategoriasEquipo } from './_lib/queries'
import { EquiposTable, EQUIPOS_COLUMN_DEFS } from './_components/equipos-table'
import { CrearEquipoDialog } from './_components/crear-equipo-dialog'
import { ExportEquiposButton } from './_components/export-equipos-button'
import { GenericColumnConfig } from '@/components/ui/column-config-generic'
import { DownloadTemplateButton } from '@/components/ui/download-template-button'

export default async function EquiposPage() {
  const [equipos, categorias] = await Promise.all([
    fetchEquipos(),
    fetchCategoriasEquipo(),
  ])

  // Extract unique disciplinas from categorias
  const disciplinas = [...new Set(categorias.map((c) => c.disciplina_slug))].sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Equipos</h1>
        <div className="flex items-center gap-2">
          <GenericColumnConfig storageKey="equipos-columns" columns={EQUIPOS_COLUMN_DEFS} />
          <DownloadTemplateButton
            headers={['nombre', 'disciplina_slug', 'modalidad', 'categoria', 'nivel_competencia', 'color_principal']}
            filename="modelo_equipos.csv"
            sampleRow={['Sub-15 Masculino', 'futbol', 'M', 'sub_15', 'competitivo', '#003366']}
          />
          <ExportEquiposButton equipos={equipos} />
          <CrearEquipoDialog categorias={categorias} disciplinas={disciplinas} />
        </div>
      </div>

      <EquiposTable equipos={equipos} />
    </div>
  )
}
