import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { deleteUnit } from '@/services/units.service'
import type { UnitListItem } from '@/types/units'
import { UnitsCards } from './components/units-cards'
import { UnitsFilters } from './components/units-filters'
import { UnitsTable } from './components/units-table'
import { useUnitsList } from './hooks/use-units-list'

export function UnitsPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useUnitsList()

  const [pendingDelete, setPendingDelete] = useState<UnitListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteUnit(pendingDelete.id)
      toast({ title: 'Unidade excluída com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a unidade.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Unidades', href: ROUTES.units }]}>
      <PageHeader title="Unidades" description="Gerencie as unidades disponíveis para turmas e matrículas." />

      <div className="flex flex-col gap-5">
        <UnitsFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          headerAction={
            isManager ? (
              <Link to={ROUTES.unitNew} className={cn(buttonVariants({ variant: 'primary' }), 'rounded-full')}>
                <Plus className="size-4" aria-hidden="true" />
                Nova unidade
              </Link>
            ) : undefined
          }
        />

        <Card className="rounded-lg shadow-md">
          {state === 'success' && result && result.items.length > 0 && (
            <>
              <CardHeader>
                <CardTitle className="text-body">{result.total} unidades encontradas</CardTitle>
                <CardDescription className="text-caption">
                  Clique em uma unidade para ver o cadastro completo
                </CardDescription>
              </CardHeader>
              <Separator />
            </>
          )}
          <CardContent className="pt-5">
            {state === 'loading' && <TableSkeleton rows={6} columns={3} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
              <EmptyState
                icon={<Building2 className="size-6" aria-hidden="true" />}
                title="Nenhuma unidade cadastrada"
                description="Quando uma unidade for cadastrada, ela aparecerá aqui."
                action={
                  isManager ? (
                    <Link to={ROUTES.unitNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                      <Plus className="size-4" aria-hidden="true" />
                      Cadastrar unidade
                    </Link>
                  ) : undefined
                }
              />
            )}

            {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
              <EmptyState
                icon={<Building2 className="size-6" aria-hidden="true" />}
                title="Nenhuma unidade encontrada"
                description="Nenhuma unidade corresponde aos filtros selecionados."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            )}

            {state === 'success' && result && result.items.length > 0 && (
              <div className="flex flex-col gap-5">
                <UnitsTable
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="hidden lg:block"
                />
                <UnitsCards
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
            <DialogTitle>Excluir unidade</DialogTitle>
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
