import { useEffect, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import type { EnrollmentFilters, EnrollmentSortBy, EnrollmentStatusFilter } from '@/types/enrollments'
import type { EnrollmentFilterOptions } from '../hooks/use-enrollment-options'

const STATUS_TABS: { value: EnrollmentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'completed', label: 'Formadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

const SORT_OPTIONS: { value: EnrollmentSortBy; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome do aluno (A-Z)' },
]

interface EnrollmentsFiltersProps {
  filters: EnrollmentFilters
  onChange: (patch: Partial<Omit<EnrollmentFilters, 'page' | 'pageSize'>>) => void
  onReset: () => void
  hasActiveFilters: boolean
  isManager: boolean
  options: EnrollmentFilterOptions
}

export function EnrollmentsFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  isManager,
  options,
}: EnrollmentsFiltersProps) {
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

  const advancedCount = [
    filters.courseId,
    filters.classId,
    filters.unitId,
    filters.enrollmentDateFrom,
    filters.enrollmentDateTo,
    filters.sellerId,
  ].filter(Boolean).length

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
          placeholder="Buscar por aluno, CPF, curso ou turma..."
          aria-label="Buscar matrículas"
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
                label="Turma"
                value={filters.classId ?? ''}
                onChange={(event) => onChange({ classId: event.target.value || null })}
              >
                <option value="">Todas</option>
                {options.classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
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

              {isManager && (
                <Select
                  label="Vendedor"
                  value={filters.sellerId ?? ''}
                  onChange={(event) => onChange({ sellerId: event.target.value || null })}
                >
                  <option value="">Todos</option>
                  {options.sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="Matrícula de"
                  value={filters.enrollmentDateFrom ?? ''}
                  onChange={(event) => onChange({ enrollmentDateFrom: event.target.value || null })}
                />
                <DatePicker
                  label="Matrícula até"
                  value={filters.enrollmentDateTo ?? ''}
                  onChange={(event) => onChange({ enrollmentDateTo: event.target.value || null })}
                />
              </div>
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
          onChange={(event) => onChange({ sortBy: event.target.value as EnrollmentSortBy })}
          containerClassName="w-44 shrink-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
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
