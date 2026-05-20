'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Globe } from 'lucide-react'
import { MarcaFormDialog } from './marca-form'
import { eliminarMarcaAction } from '../lib/actions'
import type { Marca } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface MarcaRowProps {
  marca: Marca
}

export function MarcaRow({ marca }: MarcaRowProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`Eliminar marca "${marca.nombre}"?`)) return
    startTransition(async () => {
      await eliminarMarcaAction({ id: marca.id })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50" data-testid={`marca-row-${marca.slug}`}>
      <div className="flex items-center gap-3 min-w-0">
        {marca.logo_url ? (
          <Image src={marca.logo_url} alt={marca.nombre} width={32} height={32} className="h-8 w-8 rounded object-contain border" unoptimized />
        ) : (
          <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
            {marca.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{marca.nombre}</p>
          <p className="text-xs text-muted-foreground">{marca.slug}</p>
        </div>
        {marca.sitio_web && (
          <a
            href={marca.sitio_web}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <MarcaFormDialog
          mode="edit"
          marca={marca}
          triggerRender={<Button variant="ghost" size="sm" />}
          triggerLabel="Editar"
        />
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
