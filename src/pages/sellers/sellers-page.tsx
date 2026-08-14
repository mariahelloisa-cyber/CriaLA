import { useState } from 'react'
import { Plus, Users2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createSeller, updateSellerName, updateSellerStatus } from '@/services/sellers.service'
import type { CreateSellerInput, SellerListItem } from '@/types/sellers'
import { NewSellerDialog } from './components/new-seller-dialog'
import { SellerEditDialog } from './components/seller-edit-dialog'
import { SellerStatusDialog } from './components/seller-status-dialog'
import { SellersCards } from './components/sellers-cards'
import { SellersFilters } from './components/sellers-filters'
import { SellersTable } from './components/sellers-table'
import { useSellersList } from './hooks/use-sellers-list'

export function SellersPage() {
  const shellUser = useShellUser()
  const { range, setRange, filters, updateFilters, resetFilters, hasActiveFilters, sellers, totalUnfiltered, state, error, retry } =
    useSellersList()

  const [newSellerDialogOpen, setNewSellerDialogOpen] = useState(false)
  const [creatingSeller, setCreatingSeller] = useState(false)
  const [editingSeller, setEditingSeller] = useState<SellerListItem | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [statusSeller, setStatusSeller] = useState<SellerListItem | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  async function handleCreateSeller(values: CreateSellerInput) {
    setCreatingSeller(true)
    try {
      await createSeller(values)
      toast({ title: 'Vendedor criado com sucesso.', variant: 'success' })
      setNewSellerDialogOpen(false)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível criar o vendedor.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setCreatingSeller(false)
    }
  }

  async function handleSaveName(fullName: string) {
    if (!editingSeller) return
    setSavingEdit(true)
    try {
      await updateSellerName(editingSeller.id, fullName)
      toast({ title: 'Vendedor atualizado com sucesso.', variant: 'success' })
      setEditingSeller(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível atualizar o vendedor.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleConfirmStatus() {
    if (!statusSeller) return
    setSavingStatus(true)
    try {
      await updateSellerStatus(statusSeller.id, !statusSeller.is_active)
      toast({
        title: statusSeller.is_active ? 'Vendedor desativado.' : 'Vendedor ativado.',
        variant: 'success',
      })
      setStatusSeller(null)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível atualizar o status do vendedor.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendedores', href: ROUTES.sellers }]}>
      <PageHeader
        title="Vendedores"
        description="Gerencie a equipe comercial, acompanhe desempenho e metas por vendedor."
        actions={
          <Button variant="primary" className="rounded-full" onClick={() => setNewSellerDialogOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Novo vendedor
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card className="rounded-lg p-4 shadow-md">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-body-sm font-medium text-foreground">Período (valor vendido, meta e ranking)</p>
                <p className="text-caption text-muted-foreground">Padrão: mês atual — dia 1 ao último dia</p>
              </div>
              <div className="flex items-end gap-2">
                <DatePicker
                  label="De"
                  value={range.from}
                  onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
                />
                <DatePicker
                  label="Até"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
            </div>

            <SellersFilters
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </Card>

        <Card className="rounded-lg shadow-md">
          {state === 'success' && sellers.length > 0 && (
            <>
              <CardHeader className="p-4">
                <CardTitle className="text-body">Lista de vendedores</CardTitle>
                <CardDescription className="text-caption">Clique em um vendedor para ver o detalhe completo</CardDescription>
              </CardHeader>
              <Separator />
            </>
          )}
          <CardContent className="px-4 pb-4 pt-4">
            {state === 'loading' && <TableSkeleton rows={5} columns={5} />}

            {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

            {state === 'success' && totalUnfiltered === 0 && (
              <EmptyState
                icon={<Users2 className="size-6" aria-hidden="true" />}
                title="Nenhum vendedor cadastrado"
                description="Quando um vendedor for cadastrado, ele aparecerá aqui."
                action={
                  <Button variant="primary" size="sm" onClick={() => setNewSellerDialogOpen(true)}>
                    <Plus className="size-4" aria-hidden="true" />
                    Novo vendedor
                  </Button>
                }
              />
            )}

            {state === 'success' && totalUnfiltered > 0 && sellers.length === 0 && (
              <EmptyState
                icon={<Users2 className="size-6" aria-hidden="true" />}
                title="Nenhum vendedor encontrado"
                description="Nenhum vendedor corresponde aos filtros selecionados."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            )}

            {state === 'success' && sellers.length > 0 && (
              <>
                <SellersTable
                  items={sellers}
                  onEdit={setEditingSeller}
                  onToggleStatus={setStatusSeller}
                  className="hidden lg:block"
                />
                <SellersCards
                  items={sellers}
                  onEdit={setEditingSeller}
                  onToggleStatus={setStatusSeller}
                  className="lg:hidden"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <NewSellerDialog
        open={newSellerDialogOpen}
        onOpenChange={setNewSellerDialogOpen}
        submitting={creatingSeller}
        onSubmit={handleCreateSeller}
      />

      <SellerEditDialog
        open={editingSeller !== null}
        onOpenChange={(open) => !open && setEditingSeller(null)}
        seller={editingSeller}
        submitting={savingEdit}
        onSubmit={handleSaveName}
      />

      <SellerStatusDialog
        seller={statusSeller}
        onOpenChange={(open) => !open && setStatusSeller(null)}
        submitting={savingStatus}
        onConfirm={handleConfirmStatus}
      />
    </AppShell>
  )
}
