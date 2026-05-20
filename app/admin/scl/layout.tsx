import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Home, Building2, LogOut } from 'lucide-react'

export default async function SCLLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que es admin SCL (por ahora, cualquier usuario logueado)
  // TODO: Tramo 8 — verificar rol admin_scl o superadmin

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-background p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Panel SCL</span>
        </div>
        <nav className="space-y-1">
          <Link
            href="/admin/scl"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/scl/tenants"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
          >
            <Building2 className="h-4 w-4" />
            Tenants
          </Link>
        </nav>
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground px-3 truncate">{user.email}</p>
        </div>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
