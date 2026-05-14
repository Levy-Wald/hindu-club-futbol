'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  agregarImagenAProductoAction,
  eliminarImagenAction,
  establecerImagenPrincipalAction,
} from '../lib/actions'
import type { ProductoImagen } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'private-productos-imagenes'

interface GaleriaImagenesProps {
  productoId: string
  imagenes: ProductoImagen[]
}

export function GaleriaImagenes({ productoId, imagenes }: GaleriaImagenesProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imagenes JPEG, PNG o WebP')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('La imagen no puede superar 5MB')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${productoId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setError(`Error subiendo imagen: ${uploadError.message}`)
        return
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

      const result = await agregarImagenAProductoAction({
        producto_id: productoId,
        url: urlData.publicUrl,
        es_principal: imagenes.length === 0,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.refresh()
    })

    // Reset input so same file can be selected again
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDelete(img: ProductoImagen) {
    if (!confirm('Eliminar esta imagen?')) return
    startTransition(async () => {
      const result = await eliminarImagenAction({
        id: img.id,
        producto_id: productoId,
      })
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }

  function handleSetPrincipal(img: ProductoImagen) {
    startTransition(async () => {
      const result = await establecerImagenPrincipalAction({
        id: img.id,
        producto_id: productoId,
      })
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      {imagenes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imagenes.map((img) => (
            <div key={img.id} className="relative group border rounded-lg overflow-hidden">
              <img
                src={img.url}
                alt={img.alt_text ?? 'Imagen del producto'}
                className="h-32 w-full object-cover"
              />
              {img.es_principal && (
                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                  <Star className="h-3 w-3" fill="currentColor" />
                  Principal
                </span>
              )}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {!img.es_principal && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full"
                    onClick={() => handleSetPrincipal(img)}
                    disabled={isPending}
                    title="Establecer como principal"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => handleDelete(img)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">No hay imagenes cargadas</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
      >
        <Upload className="h-4 w-4 mr-1" />
        {isPending ? 'Subiendo...' : 'Agregar imagen'}
      </Button>
    </div>
  )
}
