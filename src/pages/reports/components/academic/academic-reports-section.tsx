import { useState } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAcademicFilterOptions } from '../../hooks/use-academic-filter-options'
import { useAcademicReportsData } from '../../hooks/use-academic-reports-data'
import type { AcademicReportFilters } from '@/services/academic-reports.service'
import type { SellerOption } from '@/types/goals'
import { AcademicReportsFilters } from './academic-reports-filters'
import { GraduatedStudentsReport } from './graduated-students-report'
import { StudentsByCategoryReport } from './students-by-category-report'
import { StudentsByClassReport } from './students-by-class-report'
import { StudentsByCourseReport } from './students-by-course-report'
import { StudentsByPeriodReport } from './students-by-period-report'
import { StudentsByUnitReport } from './students-by-unit-report'
import { StudentsInTrainingReport } from './students-in-training-report'
import { UpcomingGraduationsReport } from './upcoming-graduations-report'

const DEFAULT_FILTERS: AcademicReportFilters = {
  courseId: null,
  classId: null,
  unitId: null,
  categoryId: null,
  sellerId: null,
}

type AcademicTab = 'class' | 'course' | 'category' | 'period' | 'unit' | 'training' | 'graduating' | 'graduated'

interface AcademicReportsSectionProps {
  isManager: boolean
  sellers: SellerOption[]
}

/**
 * Seção "Acadêmicos" de /relatorios (Fase 17 — PDF seção 8). Uma única
 * query (useAcademicReportsData) alimenta os 7 relatórios; os filtros
 * estruturais (Curso/Turma/Unidade/Categoria/Vendedor) são compartilhados
 * por todos, "Por Período" tem seu próprio intervalo local (ver
 * students-by-period-report.tsx). Respeita a mesma RLS de sempre —
 * enrollments_select já restringe o vendedor às matrículas dos próprios
 * alunos, então todo relatório aqui (inclusive as agregações) reflete só o
 * que a sessão dele pode ver, nunca dados globais de outros vendedores.
 *
 * `isManager`/`sellers` vêm do useScopedSellers já chamado por reports-page.tsx
 * (Fase 25) — nenhuma query de vendedores nova aqui, só reaproveitamento.
 */
export function AcademicReportsSection({ isManager, sellers }: AcademicReportsSectionProps) {
  const [filters, setFilters] = useState<AcademicReportFilters>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState<AcademicTab>('class')
  const options = useAcademicFilterOptions()

  const { rows, byClass, byCourse, byCategory, byUnit, inTraining, upcomingGraduations, graduated, state, error, retry } =
    useAcademicReportsData(filters)

  function updateFilters(patch: Partial<AcademicReportFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex flex-col gap-6">
      <AcademicReportsFilters
        filters={filters}
        onChange={updateFilters}
        options={options}
        isManager={isManager}
        sellers={sellers}
      />

      {state === 'loading' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

      {state === 'success' && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AcademicTab)}>
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="class">Por turma</TabsTrigger>
              <TabsTrigger value="course">Por curso</TabsTrigger>
              <TabsTrigger value="category">Por categoria</TabsTrigger>
              <TabsTrigger value="period">Por período</TabsTrigger>
              <TabsTrigger value="unit">Por unidade</TabsTrigger>
              <TabsTrigger value="training">Em formação</TabsTrigger>
              <TabsTrigger value="graduating">Próximas formaturas</TabsTrigger>
              <TabsTrigger value="graduated">Formados</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="class">
            <StudentsByClassReport items={byClass} />
          </TabsContent>
          <TabsContent value="course">
            <StudentsByCourseReport items={byCourse} />
          </TabsContent>
          <TabsContent value="category">
            <StudentsByCategoryReport items={byCategory} />
          </TabsContent>
          <TabsContent value="period">
            <StudentsByPeriodReport rows={rows} />
          </TabsContent>
          <TabsContent value="unit">
            <StudentsByUnitReport items={byUnit} />
          </TabsContent>
          <TabsContent value="training">
            <StudentsInTrainingReport items={inTraining} />
          </TabsContent>
          <TabsContent value="graduating">
            <UpcomingGraduationsReport items={upcomingGraduations} />
          </TabsContent>
          <TabsContent value="graduated">
            <GraduatedStudentsReport items={graduated} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
