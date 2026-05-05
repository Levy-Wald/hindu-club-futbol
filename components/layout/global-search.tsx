'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  Shield,
  Building2,
  Trophy,
  FileText,
  Settings,
  MessageSquare,
  Wallet,
  Loader2,
  LayoutGrid,
} from 'lucide-react'
import { globalSearch, type SearchResult, type SearchResults, type SearchResultCategory } from '@/lib/search/global-search'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  personas: 'Personas',
  equipos: 'Equipos',
  padrones: 'Padrones',
  externos: 'Externos',
  paginas: 'Páginas',
}

const CATEGORY_ORDER: SearchResultCategory[] = ['personas', 'equipos', 'padrones', 'externos', 'paginas']

function CategoryIcon({ categoria }: { categoria: SearchResultCategory }) {
  const cls = 'h-4 w-4 shrink-0 text-muted-foreground'
  switch (categoria) {
    case 'personas': return <Users className={cls} />
    case 'equipos':  return <Trophy className={cls} />
    case 'padrones': return <Shield className={cls} />
    case 'externos': return <Building2 className={cls} />
    case 'paginas':  return <LayoutGrid className={cls} />
  }
}

function PageIcon({ url }: { url: string }) {
  const cls = 'h-4 w-4 shrink-0 text-muted-foreground'
  if (url.includes('configuracion')) return <Settings className={cls} />
  if (url.includes('comunicaciones')) return <MessageSquare className={cls} />
  if (url.includes('cajas')) return <Wallet className={cls} />
  if (url.includes('padrones')) return <Shield className={cls} />
  if (url.includes('equipos')) return <Trophy className={cls} />
  if (url.includes('externos')) return <Building2 className={cls} />
  if (url.includes('personas')) return <Users className={cls} />
  return <FileText className={cls} />
}

function flattenResults(results: SearchResults): SearchResult[] {
  return CATEGORY_ORDER.flatMap((cat) => results[cat])
}

// ─── Main component ────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Keyboard shortcut to open ──────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Focus input when opened ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => inputRef.current?.focus(), 10)
    } else {
      setQuery('')
      setResults(null)
      setActiveIndex(0)
    }
  }, [open])

  // ── Debounced search ───────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await globalSearch(q)
      setResults(res)
      setActiveIndex(0)
    } catch {
      // silently ignore errors
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 200)
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  const flat = results ? flattenResults(results) : []

  function navigate(result: SearchResult) {
    router.push(result.url)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flat[activeIndex]
      if (item) navigate(item)
    }
  }

  // ── Render results grouped by category ─────────────────────────────────────
  function renderResults() {
    if (!results) return null

    const totalResults = flat.length

    if (totalResults === 0) {
      return (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Sin resultados para &quot;{query}&quot;
        </div>
      )
    }

    let globalIdx = 0
    return (
      <div className="py-2">
        {CATEGORY_ORDER.map((cat) => {
          const items = results[cat]
          if (items.length === 0) return null

          return (
            <div key={cat}>
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
              {items.map((item) => {
                const idx = globalIdx++
                const isActive = idx === activeIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => navigate(item)}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background">
                      {cat === 'paginas'
                        ? <PageIcon url={item.url} />
                        : <CategoryIcon categoria={cat} />
                      }
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.titulo}</span>
                      {item.subtitulo && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.subtitulo}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Empty state (no query yet) ─────────────────────────────────────────────
  function renderEmpty() {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        Escribí para buscar personas, equipos, padrones y más
      </div>
    )
  }

  return (
    <>
      {/* Trigger button in topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Overlay + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Búsqueda global"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border bg-popover shadow-2xl overflow-hidden">
            {/* Search input row */}
            <div className="flex items-center gap-2 border-b px-3">
              {loading
                ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                : <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar personas, equipos, padrones..."
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd
                className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground cursor-pointer"
                onClick={() => setOpen(false)}
              >
                ESC
              </kbd>
            </div>

            {/* Results area */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length === 0 ? renderEmpty() : renderResults()}
            </div>

            {/* Footer hint */}
            {flat.length > 0 && (
              <div className="flex items-center gap-3 border-t px-3 py-2 text-[10px] text-muted-foreground">
                <span><kbd className="rounded border px-1 font-mono">↑↓</kbd> navegar</span>
                <span><kbd className="rounded border px-1 font-mono">↵</kbd> abrir</span>
                <span><kbd className="rounded border px-1 font-mono">ESC</kbd> cerrar</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
