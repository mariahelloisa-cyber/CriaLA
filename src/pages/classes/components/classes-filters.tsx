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
import type { ClassFilters, ClassStatusFilter } from '@/types/classes'
import type { ClassFilterOptions } from '../hooks/use-class-options'

const STATUS_TABS: { value: ClassStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Abertas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'closed', label: 'Encerradas' },
]

interface ClassesFiltersProps {
  filters: ClassFilters
  onChange: (patch: Partial<Omit<ClassFilters, 'page' | 'pageSize'>>) => void
  onReset: () => void
  hasActiveFilters: boolean
  options: ClassFilterOptions
  headerAction?: ReactNode
}

export function ClassesFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  options,
  headerAction,
}: ClassesFiltersProps) {
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

  const advancedCount = [filters.courseId, filters.unitId, filters.categoryId].filter(Boolean).length

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
          placeholder="Buscar por turma, curso ou unidade..."
          aria-label="Buscar turmas"
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
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Curso"
                value={filters.courseId ?? ''}
                onChange={(event) => onChange({ courseId: event.target.value || null })}
              >
                <option value="">Todos</option>
                {options.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Unidade"
                value={filters.unitId ?? ''}
                onChange={(event) => onChange({ unitId: event.target.value || null })}
              >
                <option value="">Todas</option>
                {options.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
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
