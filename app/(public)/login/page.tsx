import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hindu Club</CardTitle>
          <CardDescription>
            Ingresá con tu email para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MagicLinkForm />
        </CardContent>
      </Card>
    </div>
  )
}
