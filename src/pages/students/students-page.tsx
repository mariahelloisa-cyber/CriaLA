import { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
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
import { deleteStudent } from '@/services/students.service'
import { toast } from '@/hooks/use-toast'
import type { StudentListItem } from '@/types/students'
import { StudentsCards } from './components/students-cards'
import { StudentsFilters } from './components/students-filters'
import { StudentsTable } from './components/students-table'
import { useFilterOptions } from './hooks/use-filter-options'
import { useStudentsList } from './hooks/use-students-list'

/**
 * Layout pedido pelo usuário (referência visual): busca + "Novo aluno" na
 * mesma linha (botão saiu do PageHeader e virou `headerAction` de
 * `StudentsFilters`), pílulas de status arredondadas (mesmo valores
 * Todos/Ativos/Formados/Cancelados de sempre — só o visual mudou), e a
 * listagem inteira dentro de um card branco com contagem + instrução no
 * cabeçalho.
 */
export function StudentsPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useStudentsList()
  const filterOptions = useFilterOptions(isManager)

  const [pendingDelete, setPendingDelete] = useState<StudentListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteStudent(pendingDelete.student.id)
      toast({ title: 'Aluno excluído com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir o aluno.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Alunos', href: ROUTES.students }]}>
      <PageHeader title="Alunos" description="Todos os alunos cadastrados no projeto" />

      <div className="flex flex-col gap-5">
        <StudentsFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          isManager={isManager}
          options={filterOptions}
          headerAction={
            <Link to={ROUTES.studentNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
              <UserPlus className="size-4" aria-hidden="true" />
              Novo aluno
            </Link>
          }
        />

        <Card className="rounded-lg shadow-md">
          {state === 'success' && result && result.items.length > 0 && (
            <>
              <CardHeader>
                <CardTitle className="text-body">{result.total} alunos encontrados</CardTitle>
                <CardDescription className="text-caption">
                  Clique em um aluno para ver o cadastro completo
                </CardDescription>
              </CardHeader>
              <Separator />
            </>
          )}
          <CardContent className="pt-5">
            {state === 'loading' && <TableSkeleton rows={6} columns={isManager ? 8 : 7} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
              <EmptyState
                icon={<Users className="size-6" aria-hidden="true" />}
                title={isManager ? 'Nenhum aluno cadastrado' : 'Você ainda não cadastrou nenhum aluno.'}
                description="Quando um aluno for matriculado, ele aparecerá aqui."
                action={
                  <Link to={ROUTES.studentNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Cadastrar aluno
                  </Link>
                }
              />
            )}

            {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
              <EmptyState
                icon={<Users className="size-6" aria-hidden="true" />}
                title="Nenhum aluno encontrado"
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
                <StudentsTable
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="hidden lg:block"
                />
                <StudentsCards
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="lg:hidden"
                />
                <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir aluno</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir{' '}
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
