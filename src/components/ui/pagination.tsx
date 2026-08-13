import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './icon-button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  /** Quando informados junto com `pageSize`/`itemLabel`, mostra "Mostrando X a Y de Z <itemLabel>" e não esconde o componente com 1 página só. Omitir mantém o comportamento padrão (sem texto, escondido com 1 página). */
  totalItems?: number
  pageSize?: number
  itemLabel?: string
}

function getPageList(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  sorted.forEach((p, index) => {
    if (index > 0) {
      const prev = sorted[index - 1]
      if (prev !== undefined && p - prev > 1) result.push('ellipsis')
    }
    result.push(p)
  })
  return result
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
  itemLabel,
}: PaginationProps) {
  const showInfo = totalItems !== undefined && pageSize !== undefined
  if (!showInfo && totalPages <= 1) return null

  const pages = getPageList(page, totalPages)
  const from = totalItems === 0 ? 0 : (page - 1) * (pageSize ?? 0) + 1
  const to = Math.min(page * (pageSize ?? 0), totalItems ?? 0)

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-between gap-2', className)}>
      {showInfo && (
        <p className="text-body-sm text-muted-foreground">
          Mostrando {from} a {to} de {totalItems} {itemLabel}
        </p>
      )}

      <div className="ml-auto flex items-center gap-2">
        <IconButton
          label="Página anterior"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </IconButton>

        <ul className="flex items-center gap-1">
          {pages.map((p, index) =>
            p === 'ellipsis' ? (
              <li key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md text-body-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    p === page ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                  )}
                >
                  {p}
                </button>
              </li>
            ),
          )}
        </ul>

        <IconButton
          label="Próxima página"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  )
}
