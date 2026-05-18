import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PlaceholderProximamenteProps {
  titulo: string
  descripcion?: string
}

export function PlaceholderProximamente({ titulo, descripcion }: PlaceholderProximamenteProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{titulo}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Próximamente</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {descripcion || 'Este módulo está en desarrollo y estará disponible pronto.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
