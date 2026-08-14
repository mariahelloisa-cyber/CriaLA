import { Select } from '@/components/ui/select'
import type { AcademicReportFilters } from '@/services/academic-reports.service'
import type { SellerOption } from '@/types/goals'
import type { AcademicFilterOptions } from '../../hooks/use-academic-filter-options'

interface AcademicReportsFiltersProps {
  filters: AcademicReportFilters
  onChange: (patch: Partial<AcademicReportFilters>) => void
  options: AcademicFilterOptions
  /** Só o gerente vê o filtro de Vendedor — mesmo padrão de reports-filters.tsx/enrollments-filters.tsx/students-filters.tsx. */
  isManager: boolean
  sellers: SellerOption[]
}

/**
 * Filtros estruturais compartilhados pelos 7 relatórios acadêmicos (seção 11
 * do prompt). Deliberadamente SEM filtro de Status nem de período aqui:
 * Status conflitaria com o significado de "Em Formação"/"Formados" (cada um
 * já é, por definição, um filtro de status específico); Período é
 * inerentemente mensal só no relatório "Por Período", que tem seu próprio
 * seletor local (mesmo padrão de "Metas x realizado" da Fase 13, que também
 * usa um período independente do resto da página).
 *
 * Vendedor (Fase 25): fecha a última das 6 dimensões de filtro exigidas pelo
 * PDF (seção 10) que faltava aqui. Escondido para o próprio vendedor — RLS
 * (enrollments_select) já restringe a sessão dele às próprias matrículas, e
 * expor um seletor "escolha outro vendedor" que não faria nada real seria
 * confuso, mesmo critério já usado nos outros 3 módulos com esse filtro.
 */
export function AcademicReportsFilters({ filters, onChange, options, isManager, sellers }: AcademicReportsFiltersProps) {
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
      {isManager && (
        <Select
          label="Vendedor"
          value={filters.sellerId ?? ''}
          onChange={(event) => onChange({ sellerId: event.target.value || null })}
        >
          <option value="">Todos os vendedores</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name}
            </option>
          ))}
        </Select>
      )}
    </div>
  )
}
