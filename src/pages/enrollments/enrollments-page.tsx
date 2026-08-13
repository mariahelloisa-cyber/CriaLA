import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, GraduationCap, Plus, Users, XCircle } from 'lucide-react'
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
import { deleteEnrollment, getEnrollmentsOverview } from '@/services/enrollments.service'
import type { EnrollmentListItem, EnrollmentsOverview } from '@/types/enrollments'
import { formatMetricValue } from '@/utils/format-metric'
import { EnrollmentsCards } from './components/enrollments-cards'
import { EnrollmentsFilters } from './components/enrollments-filters'
import { EnrollmentsTable } from './components/enrollments-table'
import { useEnrollmentOptions } from './hooks/use-enrollment-options'
import { useEnrollmentsList } from './hooks/use-enrollments-list'

export function EnrollmentsPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useEnrollmentsList()
  const filterOptions = useEnrollmentOptions(isManager)

  const [pendingDelete, setPendingDelete] = useState<EnrollmentListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [overview, setOverview] = useState<EnrollmentsOverview | null>(null)

  useEffect(() => {
    let active = true
    getEnrollmentsOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch(() => {
        if (active) setOverview(null)
      })
    return () => {
      active = false
    }
    // Recarrega sempre que a listagem recarrega (ex.: após criar/excluir uma matrícula).
  }, [result])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteEnrollment(pendingDelete.id)
      toast({ title: 'Matrícula excluída com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a matrícula.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Matrículas', href: ROUTES.enrollments }]}>
      <PageHeader
        title="Matrículas"
        description="Gerencie as matrículas e acompanhe a jornada acadêmica dos alunos."
        actions={
          <Link to={ROUTES.enrollmentNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
            <Plus className="size-4" aria-hidden="true" />
            Nova matrícula
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <Card className="rounded-lg p-4 shadow-md">
          <EnrollmentsFilters
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            isManager={isManager}
            options={filterOptions}
          />
        </Card>

        {overview && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total de matrículas"
              value={formatMetricValue(overview.total)}
              description="Todas as matrículas"
              icon={Users}
              tone="primary"
            />
            <MetricCard
              title="Matrículas ativas"
              value={formatMetricValue(overview.active)}
              description="Em andamento"
              icon={CheckCircle2}
              tone="success"
            />
            <MetricCard
              title="Matrículas formadas"
              value={formatMetricValue(overview.completed)}
              description="Concluídas"
              icon={GraduationCap}
              tone="accent"
            />
            <MetricCard
              title="Matrículas canceladas"
              value={formatMetricValue(overview.cancelled)}
              description="Canceladas"
              icon={XCircle}
              tone="warning"
            />
          </div>
        )}

        <Card className="rounded-lg shadow-md">
          {state === 'success' && result && result.items.length > 0 && (
            <>
              <CardHeader className="p-4">
                <CardTitle className="text-body">Lista de matrículas</CardTitle>
                <CardDescription className="text-caption">
                  Clique em uma matrícula para ver o cadastro completo
                </CardDescription>
              </CardHeader>
              <Separator />
            </>
          )}
          <CardContent className="px-4 pb-4 pt-4">
            {state === 'loading' && <TableSkeleton rows={6} columns={isManager ? 8 : 7} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
              <EmptyState
                icon={<ClipboardList className="size-6" aria-hidden="true" />}
                title={isManager ? 'Nenhuma matrícula cadastrada' : 'Você ainda não possui matrículas.'}
                description="Quando uma matrícula for registrada, ela aparecerá aqui."
                action={
                  <Link to={ROUTES.enrollmentNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    <Plus className="size-4" aria-hidden="true" />
                    Nova matrícula
                  </Link>
                }
              />
            )}

            {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
              <EmptyState
                icon={<ClipboardList className="size-6" aria-hidden="true" />}
                title="Nenhuma matrícula encontrada"
                description="Tente ajustar a busca ou limpar os filtros aplicados."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            )}

            {state === 'success' && result && result.items.length > 0 && (
              <div className="flex flex-col gap-5">
                <EnrollmentsTable
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="hidden lg:block"
                />
                <EnrollmentsCards
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
                  itemLabel="matrículas"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir matrícula</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir a matrícula de{' '}
              <strong className="text-foreground">{pendingDelete?.student.full_name}</strong>? Esta ação não pode
              ser desfeita.
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
