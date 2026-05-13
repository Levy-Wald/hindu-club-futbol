'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { importarCSVFixture, importarCSVResultados } from '../lib/csv-importer'
import { generarPlantillaFixture, generarPlantillaResultados } from '../lib/csv-templates'

export function PantallaImportCSV({
  torneoId,
  torneoNombre,
  tenantId,
}: {
  torneoId: string
  torneoNombre: string
  tenantId: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'fixture' | 'resultados'>('fixture')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{
    insertados: number
    errores: string[]
  } | null>(null)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const [csvContent, setCsvContent] = useState<string | null>(null)

  function descargarPlantilla() {
    const content = tab === 'fixture' ? generarPlantillaFixture() : generarPlantillaResultados()
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tab === 'fixture' ? 'plantilla_fixture.csv' : 'plantilla_resultados.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvContent(text)
      setResultado(null)

      // Generate preview (first 5 rows)
      const lines = text.split('\n').filter((l) => l.trim())
      const previewRows = lines.slice(0, 6).map((line) =>
        line.split(',').map((cell) => cell.trim())
      )
      setPreview(previewRows)
    }
    reader.readAsText(file)
  }

  async function handleImportar() {
    if (!csvContent) return
    setLoading(true)
    setResultado(null)

    const fn = tab === 'fixture' ? importarCSVFixture : importarCSVResultados
    const res = await fn({
      torneo_id: torneoId,
      csv_content: csvContent,
      tenant_id: tenantId,
    })

    setResultado({ insertados: res.insertados, errores: res.errores })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <div data-testid="pantalla-import-csv">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/competencias/torneos/${torneoId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Importar CSV</h1>
          <p className="text-muted-foreground">{torneoNombre}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as 'fixture' | 'resultados'); setPreview(null); setCsvContent(null); setResultado(null) }}>
        <TabsList>
          <TabsTrigger value="fixture" data-testid="tab-fixture">Importar fixture</TabsTrigger>
          <TabsTrigger value="resultados" data-testid="tab-resultados">Importar resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="fixture" className="space-y-4 mt-4">
          <ImportSection
            tipo="fixture"
            onDescargar={descargarPlantilla}
            onFileChange={handleFileChange}
            preview={preview}
            resultado={resultado}
            loading={loading}
            csvContent={csvContent}
            onImportar={handleImportar}
          />
        </TabsContent>

        <TabsContent value="resultados" className="space-y-4 mt-4">
          <ImportSection
            tipo="resultados"
            onDescargar={descargarPlantilla}
            onFileChange={handleFileChange}
            preview={preview}
            resultado={resultado}
            loading={loading}
            csvContent={csvContent}
            onImportar={handleImportar}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ImportSection({
  tipo,
  onDescargar,
  onFileChange,
  preview,
  resultado,
  loading,
  csvContent,
  onImportar,
}: {
  tipo: string
  onDescargar: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  preview: string[][] | null
  resultado: { insertados: number; errores: string[] } | null
  loading: boolean
  csvContent: string | null
  onImportar: () => void
}) {
  return (
    <>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onDescargar}>
          <Download className="h-4 w-4 mr-2" />
          Descargar plantilla CSV
        </Button>
      </div>

      <div>
        <Input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          data-testid="file-input-csv"
        />
      </div>

      {preview && preview.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {preview[0].map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.slice(1).map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground p-3">
            Mostrando primeras {Math.min(preview.length - 1, 5)} filas
          </p>
        </div>
      )}

      {csvContent && (
        <Button
          data-testid="btn-importar"
          onClick={onImportar}
          disabled={loading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {loading ? 'Importando...' : `Importar ${tipo}`}
        </Button>
      )}

      {resultado && (
        <div className="space-y-2">
          <p className={resultado.errores.length === 0 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
            {resultado.insertados} partido(s) importado(s).
            {resultado.errores.length > 0 && ` ${resultado.errores.length} error(es).`}
          </p>
          {resultado.errores.length > 0 && (
            <div className="border rounded-lg" data-testid="tabla-errores-import">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.errores.map((err, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-destructive text-sm">{err}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
