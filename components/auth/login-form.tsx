'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Loader2, KeyRound } from 'lucide-react'
import { DEFAULT_TENANT_ID } from '@/lib/tenant'
import { resolveLandingPath } from '@/app/(public)/login/_actions'

type Mode = 'magic-link' | 'password'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error('Ingresá un email válido'); return }

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
      toast.error('Error al enviar el magic link', { description: error.message })
      return
    }
    setEnviado(true)
    toast.success('Magic link enviado', { description: 'Revisá tu email para entrar.' })
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Completá email y contraseña'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      toast.error('Error al iniciar sesión', { description: error.message })
      return
    }

    // Login-branching (F3): admin → back office, socio → portal.
    const destino = await resolveLandingPath().catch(() => `/admin/${DEFAULT_TENANT_ID}`)
    router.push(destino)
    router.refresh()
  }

  if (enviado) {
    return (
      <div className="text-center space-y-4">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Revisá tu email</h2>
        <p className="text-muted-foreground">
          Te enviamos un link para entrar. Hacé click en el link del email.
        </p>
        <Button variant="ghost" onClick={() => setEnviado(false)}>
          Usar otro email
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={mode === 'magic-link' ? handleMagicLink : handlePassword} className="space-y-4">
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

        {mode === 'password' && (
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : mode === 'magic-link' ? (
            <Mail className="mr-2 h-4 w-4" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          {mode === 'magic-link' ? 'Enviar magic link' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setMode(mode === 'magic-link' ? 'password' : 'magic-link')}
        >
          {mode === 'magic-link' ? 'Usar contraseña' : 'Usar magic link'}
        </Button>
      </div>
    </div>
  )
}
