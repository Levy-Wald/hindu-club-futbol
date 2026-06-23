import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function PortalPerfilPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi perfil</h1>
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Tu perfil y el de tu familia (dependientes) llegan en el próximo sub-sprint.
        </CardContent>
      </Card>
    </div>
  )
}
