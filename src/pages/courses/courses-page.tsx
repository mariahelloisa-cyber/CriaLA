import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Clock3, GraduationCap, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { deleteCourse, getCoursesOverview } from '@/services/courses.service'
import type { CourseListItem, CoursesOverview } from '@/types/courses'
import { formatMetricValue } from '@/utils/format-metric'
import { CoursesCards } from './components/courses-cards'
import { CoursesFilters } from './components/courses-filters'
import { CoursesTable } from './components/courses-table'
import { useCourseOptions } from './hooks/use-course-options'
import { useCoursesList } from './hooks/use-courses-list'

export function CoursesPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useCoursesList()
  const { categories } = useCourseOptions()

  const [pendingDelete, setPendingDelete] = useState<CourseListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [overview, setOverview] = useState<CoursesOverview | null>(null)

  useEffect(() => {
    let active = true
    getCoursesOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch(() => {
        if (active) setOverview(null)
      })
    return () => {
      active = false
    }
    // Recarrega sempre que a listagem recarrega (ex.: após criar/excluir um curso).
  }, [result])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteCourse(pendingDelete.id)
      toast({ title: 'Curso excluído com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir o curso.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Cursos', href: ROUTES.courses }]}>
      <PageHeader
        title="Cursos"
        description="Gerencie o catálogo de cursos disponíveis para turmas e matrículas."
        actions={
          isManager ? (
            <Link to={ROUTES.courseNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
              <Plus className="size-4" aria-hidden="true" />
              Novo curso
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <Card className="rounded-lg p-4 shadow-md">
          <CoursesFilters
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            categories={categories}
          />
        </Card>

        {overview && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Cursos cadastrados"
              value={formatMetricValue(overview.total)}
              description="Total geral"
              icon={BookOpen}
              tone="primary"
            />
            <MetricCard
              title="Cursos ativos"
              value={formatMetricValue(overview.active)}
              description="Em funcionamento"
              icon={CheckCircle2}
              tone="success"
            />
            <MetricCard
              title="Categorias"
              value={formatMetricValue(overview.categories)}
              description="Cadastradas"
              icon={Clock3}
              tone="warning"
            />
            <MetricCard
              title="Matrículas vinculadas"
              value={formatMetricValue(overview.activeClassEnrollments)}
              description="Em turmas ativas"
              icon={GraduationCap}
              tone="accent"
            />
          </div>
        )}

        <Card className="rounded-lg shadow-md">
          {state === 'success' && result && result.items.length > 0 && (
            <>
              <CardHeader className="p-4">
                <CardTitle className="text-body">Lista de cursos</CardTitle>
                <CardDescription className="text-caption">
                  Clique em um curso para ver o cadastro completo
                </CardDescription>
              </CardHeader>
              <Separator />
            </>
          )}
          <CardContent className="px-4 pb-4 pt-4">
            {state === 'loading' && <TableSkeleton rows={6} columns={4} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
              <EmptyState
                icon={<BookOpen className="size-6" aria-hidden="true" />}
                title="Nenhum curso cadastrado"
                description="Quando um curso for cadastrado, ele aparecerá aqui."
                action={
                  isManager ? (
                    <Link to={ROUTES.courseNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                      <Plus className="size-4" aria-hidden="true" />
                      Cadastrar curso
                    </Link>
                  ) : undefined
                }
              />
            )}

            {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
              <EmptyState
                icon={<BookOpen className="size-6" aria-hidden="true" />}
                title="Nenhum curso encontrado"
                description="Nenhum curso corresponde aos filtros selecionados."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            )}

            {state === 'success' && result && result.items.length > 0 && (
              <div className="flex flex-col gap-5">
                <CoursesTable
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="hidden lg:block"
                />
                <CoursesCards
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="lg:hidden"
                />
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                  totalItems={result.total}
                  pageSize={result.pageSize}
                  itemLabel="cursos"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir curso</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{pendingDelete?.name}</strong>?
              Esta ação não poderá ser desfeita.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleting}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
