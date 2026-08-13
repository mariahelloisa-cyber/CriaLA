import { Select } from '@/components/ui/select'
import type { AcademicReportFilters } from '@/services/academic-reports.service'
import type { AcademicFilterOptions } from '../../hooks/use-academic-filter-options'

interface AcademicReportsFiltersProps {
  filters: AcademicReportFilters
  onChange: (patch: Partial<AcademicReportFilters>) => void
  options: AcademicFilterOptions
}

/**
 * Filtros estruturais compartilhados pelos 7 relatórios acadêmicos (seção 11
 * do prompt). Deliberadamente SEM filtro de Status nem de período aqui:
 * Status conflitaria com o significado de "Em Formação"/"Formados" (cada um
 * já é, por definição, um filtro de status específico); Período é
 * inerentemente mensal só no relatório "Por Período", que tem seu próprio
 * seletor local (mesmo padrão de "Metas x realizado" da Fase 13, que também
 * usa um período independente do resto da página).
 */
export function AcademicReportsFilters({ filters, onChange, options }: AcademicReportsFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  )
}
