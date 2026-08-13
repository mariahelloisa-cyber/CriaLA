import { useEffect, useState } from 'react'
import { Banknote, Plus } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { deleteSale, getSalesSummary, type SalesSummary } from '@/services/sales.service'
import type { SaleListItem } from '@/types/sales'
import { PaymentMethodTabs } from './components/payment-method-tabs'
import { SalesCards } from './components/sales-cards'
import { SalesFilters } from './components/sales-filters'
import { SalesStatsCards } from './components/sales-stats-cards'
import { SalesTable } from './components/sales-table'
import { useSalesList } from './hooks/use-sales-list'

const EMPTY_SUMMARY: SalesSummary = { count: 0, totalAmount: 0, goalAmount: 0 }

export function SalesPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry } =
    useSalesList()

  const [pendingDelete, setPendingDelete] = useState<SaleListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [summary, setSummary] = useState<SalesSummary>(EMPTY_SUMMARY)
  const [summaryState, setSummaryState] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setSummaryState('loading')
    getSalesSummary({ search: filters.search, paymentMethod: filters.paymentMethod })
      .then((data) => {
        if (active) {
          setSummary(data)
          setSummaryState('success')
        }
      })
      .catch(() => {
        if (active) setSummaryState('error')
      })
    return () => {
      active = false
    }
  }, [filters.search, filters.paymentMethod])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteSale(pendingDelete.id)
      toast({ title: 'Venda excluída com sucesso.', variant: 'success' })
      setPendingDelete(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a venda.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendas', href: ROUTES.sales }]}>
      <PageHeader
        title="Vendas"
        description="Acompanhe as vendas geradas a partir das matrículas."
        actions={
          isManager ? (
            <Link to={ROUTES.saleNew} className={buttonVariants({ variant: 'primary' })}>
              <Plus className="size-4" aria-hidden="true" />
              Nova venda
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        <SalesFilters filters={filters} onChange={updateFilters} />

        {summaryState === 'success' && <SalesStatsCards summary={summary} />}

        <PaymentMethodTabs
          value={filters.paymentMethod}
          onChange={(paymentMethod) => updateFilters({ paymentMethod })}
          hasActiveFilters={hasActiveFilters}
          onClear={resetFilters}
        />

        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-body">Histórico de vendas</CardTitle>
            <CardDescription className="text-caption">Ordenado por data de venda</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            {state === 'loading' && <TableSkeleton rows={6} columns={isManager ? 8 : 7} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && result && result.items.length === 0 && !hasActiveFilters && (
              <EmptyState
                icon={<Banknote className="size-6" aria-hidden="true" />}
                title={isManager ? 'Nenhuma venda registrada' : 'Você ainda não possui vendas.'}
                description="Quando uma venda for registrada, ela aparecerá aqui."
                action={
                  isManager ? (
                    <Link to={ROUTES.saleNew} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                      <Plus className="size-4" aria-hidden="true" />
                      Nova venda
                    </Link>
                  ) : undefined
                }
              />
            )}

            {state === 'success' && result && result.items.length === 0 && hasActiveFilters && (
              <EmptyState
                icon={<Banknote className="size-6" aria-hidden="true" />}
                title="Nenhuma venda encontrada"
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
                <SalesTable
                  items={result.items}
                  isManager={isManager}
                  onDelete={setPendingDelete}
                  className="hidden lg:block"
                />
                <SalesCards
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
            <DialogTitle>Excluir venda</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir a venda de{' '}
              <strong className="text-foreground">{pendingDelete?.student.full_name}</strong>? As parcelas
              vinculadas também serão removidas. Esta ação não pode ser desfeita.
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
