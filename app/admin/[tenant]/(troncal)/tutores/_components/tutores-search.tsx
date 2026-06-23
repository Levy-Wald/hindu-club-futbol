'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export function TutoresSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (q.trim()) params.set('q', q.trim())
    else params.delete('q')
    router.push(`/admin/tutores?${params.toString()}`)
  }

  return (
    <form onSubmit={submit}>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar tutor por nombre, apellido o DNI…"
        className="max-w-md"
      />
    </form>
  )
}
