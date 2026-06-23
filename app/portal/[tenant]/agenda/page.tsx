import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function PortalAgendaPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi agenda</h1>
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Tus eventos y la inscripción desde el portal llegan en el próximo sub-sprint.
        </CardContent>
      </Card>
    </div>
  )
}
