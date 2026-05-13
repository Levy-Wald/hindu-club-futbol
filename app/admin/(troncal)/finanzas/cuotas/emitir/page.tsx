import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Receipt } from 'lucide-react'

export default async function EmitirCuotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href="/admin/finanzas/cuotas">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a cuotas
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Emitir cuotas
        </h1>
        <p className="text-sm text-muted-foreground">Emision masiva de cuotas a personas suscritas</p>
      </div>

      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Formulario de emision masiva</p>
        <p className="text-sm mt-1">Selecciona un plan, periodo y confirma la emision.</p>
        <p className="text-xs mt-4 text-muted-foreground/70">
          Funcionalidad completa disponible en Sprint A3.
        </p>
      </div>
    </div>
  )
}
