'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Loader2 } from 'lucide-react'

export function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast.error('Ingresá un email válido')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      toast.error('Error al enviar el magic link', {
        description: error.message,
      })
      return
    }

    setEnviado(true)
    toast.success('Magic link enviado', {
      description: 'Revisá tu email para entrar.',
    })
  }

  if (enviado) {
    return (
      <div className="text-center space-y-4">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Revisá tu email</h2>
        <p className="text-muted-foreground">
          Te enviamos un link para entrar. Hacé click en el link del email.
        </p>
        <Button
          variant="ghost"
          onClick={() => setEnviado(false)}
        >
          Usar otro email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="tu@email.com"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Enviar magic link
      </Button>
    </form>
  )
}
