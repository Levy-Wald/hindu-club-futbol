import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { TutorRow } from '../_lib/queries'

export function TutoresTable({ tutores }: { tutores: TutorRow[] }) {
  if (tutores.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No hay tutores cargados todavía. Una persona aparece acá cuando tiene un vínculo de
        <strong> padre, madre o tutor legal</strong> con un menor.
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Tutor</th>
            <th className="p-3 font-medium">Documento</th>
            <th className="p-3 font-medium">Contacto</th>
            <th className="p-3 font-medium">Menores a cargo</th>
            <th className="p-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {tutores.map((t) => (
            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3">
                <Link href={`/admin/personas/${t.id}`} className="font-medium hover:underline">
                  {t.apellido}, {t.nombre}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground">{t.numero_documento ?? '—'}</td>
              <td className="p-3 text-muted-foreground">{t.email_principal ?? t.telefono_principal ?? '—'}</td>
              <td className="p-3">
                {t.menores.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {t.menores.map((m) => (
                      <Link key={`${m.id}-${m.tipo_vinculo_slug}`} href={`/admin/personas/${m.id}`}>
                        <Badge variant="secondary" className="hover:bg-secondary/80" title={m.tipo_vinculo_slug}>
                          {m.nombre} {m.apellido}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </td>
              <td className="p-3">
                <Badge variant={t.estado === 'activo' ? 'default' : 'secondary'} className="capitalize">
                  {t.estado}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
