import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarioLoading() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Skeleton className="h-10 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <Skeleton className="h-[600px] w-full rounded-md" />
    </div>
  )
}
