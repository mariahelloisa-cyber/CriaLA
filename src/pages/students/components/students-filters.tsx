import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
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
import type { StudentFilters, StudentStatusFilter } from '@/types/students'
import type { FilterOptions } from '../hooks/use-filter-options'

const STATUS_TABS: { value: StudentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'completed', label: 'Formados' },
  { value: 'cancelled', label: 'Cancelados' },
]

interface StudentsFiltersProps {
  filters: StudentFilters
  onChange: (patch: Partial<Omit<StudentFilters, 'page' | 'pageSize'>>) => void
  onReset: () => void
  hasActiveFilters: boolean
  isManager: boolean
  options: FilterOptions
  /** Renderizado ao lado da busca (pedido do usuário, referência visual: busca + "Novo aluno" na mesma linha). */
  headerAction?: ReactNode
}

export function StudentsFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  isManager,
  options,
  headerAction,
}: StudentsFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    // A guarda abaixo evita loop: só chama onChange quando o valor debounced
    // realmente diverge do filtro atual (inclusive quando filters.search
    // muda por outro motivo, ex.: reset externo).
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onChange])

  useEffect(() => {
    // Mantém o campo local sincronizado se os filtros forem limpos por fora.
    if (filters.search === '' && searchInput !== '') setSearchInput('')
  }, [filters.search, searchInput])

  const advancedCount = [
    filters.courseId,
    filters.categoryId,
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
          placeholder="Buscar por nome, CPF ou e-mail..."
          aria-label="Buscar alunos"
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
