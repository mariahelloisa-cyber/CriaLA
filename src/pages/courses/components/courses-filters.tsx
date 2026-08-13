import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { SearchInput } from '@/components/ui/search-input'
import { Select } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import type { CourseCategory, CourseFilters, CourseSortBy, CourseStatusFilter } from '@/types/courses'

const SORT_OPTIONS: { value: CourseSortBy; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A-Z)' },
]

const STATUS_TABS: { value: CourseStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

interface CoursesFiltersProps {
  filters: CourseFilters
  onChange: (patch: Partial<Omit<CourseFilters, 'page' | 'pageSize'>>) => void
  onReset: () => void
  hasActiveFilters: boolean
  categories: CourseCategory[]
  headerAction?: ReactNode
}

export function CoursesFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  categories,
  headerAction,
}: CoursesFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onChange])

  useEffect(() => {
    if (filters.search === '' && searchInput !== '') setSearchInput('')
  }, [filters.search, searchInput])

  const advancedCount = filters.categoryId ? 1 : 0

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
          placeholder="Buscar por curso ou categoria..."
          aria-label="Buscar cursos"
          containerClassName="flex-1"
        />

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Filter className="size-4" aria-hidden="true" />
              Filtros
              {advancedCount > 0 && (
                <Badge variant="primary" className="ml-0.5">
                  {advancedCount}
                </Badge>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="flex flex-col gap-4">
              <Select
                label="Categoria"
                value={filters.categoryId ?? ''}
                onChange={(event) => onChange({ categoryId: event.target.value || null })}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </DrawerBody>
            <DrawerFooter>
              <Button variant="ghost" onClick={clearAll}>
                Limpar filtros
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>Aplicar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Select
          aria-label="Ordenar por"
          value={filters.sortBy}
          onChange={(event) => onChange({ sortBy: event.target.value as CourseSortBy })}
          containerClassName="w-44 shrink-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

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
