'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { actualizarImagenProductoAction } from '../lib/actions'
import { useRouter } from 'next/navigation'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'private-productos-imagenes'

interface UploadImagenProductoProps {
  productoId: string
  currentUrl: string | null
}

export function UploadImagenProducto({ productoId, currentUrl }: UploadImagenProductoProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
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
      const publicUrl = urlData.publicUrl

      const result = await actualizarImagenProductoAction({
        id: productoId,
        imagen_url: publicUrl,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setPreview(publicUrl)
      router.refresh()
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await actualizarImagenProductoAction({
        id: productoId,
        imagen_url: null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPreview(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Imagen del producto"
            className="h-40 w-40 rounded-lg object-cover border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            onClick={handleRemove}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="h-40 w-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs">Sin imagen</span>
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
        {isPending ? 'Subiendo...' : preview ? 'Cambiar imagen' : 'Subir imagen'}
      </Button>
    </div>
  )
}
