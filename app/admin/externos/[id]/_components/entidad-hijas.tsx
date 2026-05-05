'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

interface EntidadHija {
  id: string
  nombre: string
  tipo: string
  activo: boolean
}

interface EntidadHijasProps {
  hijas: EntidadHija[]
}

export function EntidadHijas({ hijas }: EntidadHijasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Entidades asociadas ({hijas.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {hijas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tiene entidades asociadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hijas.map((h) => (
              <Link
                key={h.id}
                href={`/admin/externos/${h.id}`}
                className="flex items-center justify-between border rounded-md p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{h.nombre}</span>
                  <Badge variant="outline">{h.tipo}</Badge>
                </div>
                <Badge variant={h.activo ? 'default' : 'secondary'}>
                  {h.activo ? 'activo' : 'inactivo'}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
