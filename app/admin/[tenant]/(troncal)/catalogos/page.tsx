import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Library } from 'lucide-react'
import { CATALOGOS } from '@/lib/catalogos/registry'

export default function CatalogosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Catálogos del sistema</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los catálogos de valores usados en el sistema
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOGOS.map((cat) => (
          <Link key={cat.slug} href={`/admin/catalogos/${cat.slug}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Library className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="font-medium text-sm">{cat.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {cat.description}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {cat.table}
                  </Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
