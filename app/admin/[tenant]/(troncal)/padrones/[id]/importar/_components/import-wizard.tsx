'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { StepInput } from './step-input'
import { StepMapping } from './step-mapping'
import { StepDedup } from './step-dedup'
import { StepConfirm } from './step-confirm'
import { StepResults } from './step-results'
import type { ParsedData, ColumnMapping, ImportRow, ImportSummary } from '../_lib/types'

interface ImportWizardProps {
  padronId: string
  padronNombre: string
  padronTipo: string | null
}

export type WizardStep = 'verificar' | 'input' | 'mapping' | 'dedup' | 'confirm' | 'results'

const STEP_LABELS: Record<WizardStep, string> = {
  verificar: 'Verificar',
  input: 'Datos',
  mapping: 'Mapeo',
  dedup: 'Revisión',
  confirm: 'Confirmar',
  results: 'Resultado',
}

const STEPS: WizardStep[] = ['verificar', 'input', 'mapping', 'dedup', 'confirm', 'results']

export function ImportWizard({ padronId, padronNombre, padronTipo }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('verificar')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const currentStepIndex = STEPS.indexOf(step)
  const tipoOk = !!padronTipo

  const handleDataParsed = useCallback((data: ParsedData) => {
    setParsedData(data)
    setStep('mapping')
  }, [])

  const handleMappingComplete = useCallback((m: ColumnMapping[]) => {
    setMappings(m)
    setStep('dedup')
  }, [])

  const handleDedupComplete = useCallback((rows: ImportRow[]) => {
    setImportRows(rows)
    setStep('confirm')
  }, [])

  const handleImportComplete = useCallback((s: ImportSummary) => {
    setSummary(s)
    setStep('results')
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/padrones/${padronId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Importar al padrón</h1>
          <p className="text-sm text-muted-foreground">{padronNombre}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                i === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStepIndex
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {STEP_LABELS[s]}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 ${
                  i < currentStepIndex ? 'bg-primary/40' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'verificar' && (
          <StepVerificar
            padronTipo={padronTipo}
            padronId={padronId}
            onContinue={() => setStep('input')}
          />
        )}
        {step === 'input' && (
          <StepInput onDataParsed={handleDataParsed} />
        )}
        {step === 'mapping' && parsedData && (
          <StepMapping
            parsedData={parsedData}
            onComplete={handleMappingComplete}
            onBack={() => setStep('input')}
          />
        )}
        {step === 'dedup' && parsedData && (
          <StepDedup
            parsedData={parsedData}
            mappings={mappings}
            padronId={padronId}
            onComplete={handleDedupComplete}
            onBack={() => setStep('mapping')}
          />
        )}
        {step === 'confirm' && (
          <StepConfirm
            importRows={importRows}
            padronId={padronId}
            padronNombre={padronNombre}
            onComplete={handleImportComplete}
            onBack={() => setStep('dedup')}
          />
        )}
        {step === 'results' && summary && (
          <StepResults summary={summary} padronId={padronId} />
        )}
      </div>
    </div>
  )
}

// --- Paso 0: Verificar tipo del padrón ---

const TIPO_LABELS: Record<string, string> = {
  global: 'Global',
  deportivo: 'Deportivo',
  educativo: 'Educativo',
  residencial: 'Residencial',
  administrativo: 'Administrativo',
  otro: 'Otro',
}

function StepVerificar({
  padronTipo,
  padronId,
  onContinue,
}: {
  padronTipo: string | null
  padronId: string
  onContinue: () => void
}) {
  if (!padronTipo) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-base font-medium text-destructive">
              Este padrón no tiene tipo asignado
            </h2>
            <p className="text-sm text-muted-foreground">
              Para importar datos, el padrón necesita tener un tipo definido (global, deportivo, educativo, etc.).
              Esto permite validar correctamente los datos durante la importación.
            </p>
            <p className="text-sm text-muted-foreground">
              Editá el padrón desde su página de detalle para asignarle un tipo y volvé a intentar.
            </p>
            <Link href={`/admin/padrones/${padronId}`}>
              <Button variant="outline" size="sm" className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al padrón
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border border-success-500/50 bg-success-50 dark:bg-success-950/20 p-4">
        <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h2 className="text-base font-medium">Padrón listo para importar</h2>
          <p className="text-sm text-muted-foreground">
            Tipo: <strong>{TIPO_LABELS[padronTipo] ?? padronTipo}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Podés continuar con la carga de datos. El wizard te guiará paso a paso.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
