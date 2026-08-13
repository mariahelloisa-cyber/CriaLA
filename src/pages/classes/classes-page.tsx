import { useEffect, useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { CardSkeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { countEnrollmentsByClassIds, deleteClass } from '@/services/classes.service'
import type { ClassListItem } from '@/types/classes'
import { ClassesCards } from './components/classes-cards'
import { ClassesFilters } from './components/classes-filters'
import { useClassOptions } from './hooks/use-class-options'
import { useClassesList } from './hooks/use-classes-list'

export function ClassesPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useClassesList()
  const filterOptions = useClassOptions()

  const [pendingDelete, setPendingDelete] = useState<ClassListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!result || result.items.length === 0) {
      setEnrollmentCounts({})
      return
    }
    let active = true
    countEnrollmentsByClassIds(result.items.map((item) => item.id))
      .then((counts) => {
        if (active) setEnrollmentCounts(counts)
      })
      .catch(() => {
        if (active) setEnrollmentCounts({})
      })
    return () => {
      active = false
    }
  }, [result])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteClass(pendingDelete.id)
      toast({ title: 'Turma excluída com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a turma.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Turmas', href: ROUTES.classes }]}>
      <PageHeader title="Turmas" description="Gerencie as turmas disponíveis para matrícula." />

      <div className="flex flex-col gap-5">
        <ClassesFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          options={filterOptions}
          headerAction={
            isManager ? (
              <Link to={ROUTES.classNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
                <Plus className="size-4" aria-hidden="true" />
                Nova turma
              </Link>
            ) : undefined
          }
        />

        {state === 'loading' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

        {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title="Nenhuma turma cadastrada"
            description="Quando uma turma for cadastrada, ela aparecerá aqui."
            action={
              isManager ? (
                <Link to={ROUTES.classNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  <Plus className="size-4" aria-hidden="true" />
                  Cadastrar turma
                </Link>
              ) : undefined
            }
          />
        )}

        {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title="Nenhuma turma encontrada"
            description="Nenhuma turma corresponde aos filtros selecionados."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpar filtros
              </Button>
            }
          />
        )}

        {state === 'success' && result && result.items.length > 0 && (
          <>
            <ClassesCards
              items={result.items}
              isManager={isManager}
              onDelete={setPendingDelete}
              enrolledCounts={enrollmentCounts}
            />
            <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir turma</DialogTitle>
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
