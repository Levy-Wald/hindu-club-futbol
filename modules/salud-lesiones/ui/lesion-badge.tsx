import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

export function LesionBadge({ className }: { className?: string }) {
  return (
    <Badge variant="destructive" className={className}>
      <Activity className="h-3 w-3 mr-1" />
      LESIONADO
    </Badge>
  )
}
