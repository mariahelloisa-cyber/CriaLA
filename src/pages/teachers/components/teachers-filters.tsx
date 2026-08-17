import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import type { TeacherFilters, TeacherStatusFilter } from '@/types/teachers'

const STATUS_TABS: { value: TeacherStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

interface TeachersFiltersProps {
  filters: TeacherFilters
  onChange: (patch: Partial<Omit<TeacherFilters, 'page' | 'pageSize'>>) => void
  onReset: () => void
  hasActiveFilters: boolean
  headerAction?: ReactNode
}

export function TeachersFilters({ filters, onChange, onReset, hasActiveFilters, headerAction }: TeachersFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onChange])

  useEffect(() => {
    if (filters.search === '' && searchInput !== '') setSearchInput('')
  }, [filters.search, searchInput])

  function clearAll() {
    onReset()
    setSearchInput('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome, área ou e-mail..."
          aria-label="Buscar professores"
          containerClassName="flex-1"
        />
        {headerAction}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange({ status: tab.value })}
            className={cn(
              'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              filters.status === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  )
}
