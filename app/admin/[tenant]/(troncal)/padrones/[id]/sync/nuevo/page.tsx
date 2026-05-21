'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { iniciarImportRun, procesarMatching } from '@/lib/imports/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TENANT_ID } from '@/lib/tenant'


interface PadronInfo {
  id: string
  nombre: string
  pipeline_slug: string | null
  pipeline_nombre: string | null
}

export default function SyncNuevoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const padronId = params.id

  const [padron, setPadron] = useState<PadronInfo | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'uploading' | 'matching' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    setStatus('loading')
    const supabase = createClient()
    supabase
      .from('padrones')
      .select('id, nombre, pipeline_slug, import_pipelines(nombre)')
      .eq('id', padronId)
      .eq('tenant_id', TENANT_ID)
      .single()
      .then(({ data }) => {
        if (!data) {
          setStatus('error')
          setMessage('Padrón no encontrado')
          return
        }
        const plRaw = data.import_pipelines
        const plName = Array.isArray(plRaw) ? (plRaw[0] as { nombre: string } | undefined)?.nombre : (plRaw as { nombre: string } | null)?.nombre
        setPadron({
          id: data.id,
          nombre: data.nombre,
          pipeline_slug: data.pipeline_slug,
          pipeline_nombre: plName ?? null,
        })
        if (!data.pipeline_slug) {
          setStatus('error')
          setMessage('Este padrón no tiene tipo configurado. Editalo para asignarle uno.')
        } else {
          setStatus('idle')
        }
      })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!padron?.pipeline_slug || !file) return

    setStatus('uploading')
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await iniciarImportRun(padron.pipeline_slug!, formData, padronId)
      if (!result.ok) {
        setStatus('error')
        setMessage(result.message)
        return
      }

      const runId = (result.data as { runId: string })?.runId
      if (!runId) {
        setStatus('error')
        setMessage('No se recibió runId')
        return
      }

      setStatus('matching')
      setMessage(`${result.message}. Ejecutando matching...`)

      const matchResult = await procesarMatching(runId)
      if (!matchResult.ok) {
        setStatus('error')
        setMessage(`Run creado pero matching falló: ${matchResult.message}`)
        return
      }

      setStatus('done')
      setMessage(matchResult.message)
      router.push(`/admin/padrones/${padronId}/sync/${runId}`)
    })
  }

  const isProcessing = status === 'uploading' || status === 'matching' || isPending

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <Link href={`/admin/padrones/${padronId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">
          Sincronizar padrón{padron ? `: ${padron.nombre}` : ''}
        </h1>
        <Button
          type="button"
          disabled={!padron?.pipeline_slug || !file || isProcessing}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('.space-y-4')?.querySelector('form')
            form?.requestSubmit()
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {status === 'uploading' && 'Subiendo...'}
              {status === 'matching' && 'Matching...'}
              {status === 'done' && 'Redirigiendo...'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Iniciar sincronización
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo</CardTitle>
          <CardDescription>
            Subí el archivo (CSV, XLS, XLSX) para sincronizar este padrón.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {padron?.pipeline_slug && (
              <div className="space-y-2">
                <Label>Pipeline asignado</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{padron.pipeline_nombre ?? padron.pipeline_slug}</Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xls,.xlsx,.tsv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isProcessing || !padron?.pipeline_slug}
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-md ${status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                {message}
              </div>
            )}

            {/* Submit hidden — action button is in the header */}
            <button type="submit" className="hidden" />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
