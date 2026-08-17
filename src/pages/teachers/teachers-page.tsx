import { useState } from 'react'
import { Contact, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { CardSkeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { cn } from '@/lib/utils'
import { deleteTeacher } from '@/services/teachers.service'
import type { TeacherListItem } from '@/types/teachers'
import { TeachersCards } from './components/teachers-cards'
import { TeachersFilters } from './components/teachers-filters'
import { useTeachersList } from './hooks/use-teachers-list'

export function TeachersPage() {
  const shellUser = useShellUser()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useTeachersList()

  const [pendingDelete, setPendingDelete] = useState<TeacherListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteTeacher(pendingDelete.id, pendingDelete.contract_file_path)
      toast({ title: 'Professor excluído com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir o professor.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Professores', href: ROUTES.teachers }]}>
      <PageHeader title="Professores" description="Cadastre, consulte e edite os professores do sistema." />

      <div className="flex flex-col gap-5">
        <TeachersFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          headerAction={
            <Link to={ROUTES.teacherNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
              <Plus className="size-4" aria-hidden="true" />
              Novo professor
            </Link>
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
            icon={<Contact className="size-6" aria-hidden="true" />}
            title="Nenhum professor cadastrado"
            description="Quando um professor for cadastrado, ele aparecerá aqui."
            action={
              <Link to={ROUTES.teacherNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                <Plus className="size-4" aria-hidden="true" />
                Cadastrar professor
              </Link>
            }
          />
        )}

        {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
          <EmptyState
            icon={<Contact className="size-6" aria-hidden="true" />}
            title="Nenhum professor encontrado"
            description="Nenhum professor corresponde aos filtros selecionados."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpar filtros
              </Button>
            }
          />
        )}

        {state === 'success' && result && result.items.length > 0 && (
          <>
            <TeachersCards items={result.items} onDelete={setPendingDelete} />
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={setPage}
              totalItems={result.total}
              pageSize={result.pageSize}
              itemLabel="professores"
            />
          </>
        )}
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir professor</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{pendingDelete?.full_name}</strong>?
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
