'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { iniciarImportRun, procesarMatching, obtenerPipelines } from '@/lib/imports/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoImportPage() {
  const router = useRouter()
  const [pipelines, setPipelines] = useState<{ slug: string; nombre: string; descripcion: string | null; parser_strategy: string }[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading_pipelines' | 'uploading' | 'matching' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)

  // Load pipelines on first render
  if (!loaded) {
    setLoaded(true)
    setStatus('loading_pipelines')
    obtenerPipelines().then((data) => {
      setPipelines(data)
      if (data.length === 1) setSelectedSlug(data[0].slug)
      setStatus('idle')
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlug || !file) return

    setStatus('uploading')
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await iniciarImportRun(selectedSlug, formData)
      if (!result.ok) {
        setStatus('error')
        setMessage(result.message)
        return
      }

      const runId = (result.data as { runId: string })?.runId
      if (!runId) {
        setStatus('error')
        setMessage('No se recibio runId')
        return
      }

      setStatus('matching')
      setMessage(`${result.message}. Ejecutando matching...`)

      const matchResult = await procesarMatching(runId)
      if (!matchResult.ok) {
        setStatus('error')
        setMessage(`Run creado pero matching fallo: ${matchResult.message}`)
        return
      }

      setStatus('done')
      setMessage(matchResult.message)

      // Redirect to review page
      setTimeout(() => router.push(`/admin/imports/${runId}`), 1500)
    })
  }

  const isProcessing = status === 'uploading' || status === 'matching' || isPending

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <Link href="/admin/imports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nueva importacion</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo</CardTitle>
          <CardDescription>
            Selecciona el pipeline y subi el archivo (CSV, XLS, XLSX).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline</Label>
              {status === 'loading_pipelines' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando pipelines...
                </div>
              ) : (
                <select
                  id="pipeline"
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  disabled={isProcessing}
                >
                  <option value="">Seleccionar pipeline...</option>
                  {pipelines.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nombre}{p.descripcion ? ` — ${p.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xls,.xlsx,.tsv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isProcessing}
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-md ${status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                {message}
              </div>
            )}

            <Button type="submit" disabled={!selectedSlug || !file || isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {status === 'uploading' ? 'Procesando archivo...' : 'Ejecutando matching...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Iniciar importacion
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
