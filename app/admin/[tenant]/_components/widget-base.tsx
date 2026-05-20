'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

export function WidgetBase({
  title,
  loading,
  empty,
  emptyMessage,
  children,
  href,
}: {
  title: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  children?: ReactNode
  href?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {!loading && empty && (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        )}
        {!loading && !empty && children}
      </CardContent>
      {href && (
        <CardFooter className="pt-0">
          <Link href={href} className="text-sm text-primary hover:underline">
            Ver más →
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
