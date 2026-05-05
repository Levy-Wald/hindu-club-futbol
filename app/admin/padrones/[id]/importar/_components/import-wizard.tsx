'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
}

export type WizardStep = 'input' | 'mapping' | 'dedup' | 'confirm' | 'results'

const STEP_LABELS: Record<WizardStep, string> = {
  input: 'Datos',
  mapping: 'Mapeo',
  dedup: 'Revisión',
  confirm: 'Confirmar',
  results: 'Resultado',
}

const STEPS: WizardStep[] = ['input', 'mapping', 'dedup', 'confirm', 'results']

export function ImportWizard({ padronId, padronNombre }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('input')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const currentStepIndex = STEPS.indexOf(step)

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
      <div className="flex items-center gap-1">
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
