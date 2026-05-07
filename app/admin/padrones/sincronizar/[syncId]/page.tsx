import { notFound } from 'next/navigation'
import { getSyncById, getSyncDiffs } from '../_lib/queries'
import { RevisarSyncClient } from './_components/revisar-sync-client'

export default async function RevisarSyncPage({
  params,
}: {
  params: Promise<{ syncId: string }>
}) {
  const { syncId } = await params
  const [sync, diffs] = await Promise.all([
    getSyncById(syncId),
    getSyncDiffs(syncId),
  ])

  if (!sync) notFound()

  return (
    <div className="space-y-6">
      <RevisarSyncClient sync={sync} diffs={diffs} />
    </div>
  )
}
