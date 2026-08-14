import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, Pencil, Power, PowerOff, Target, TrendingUp } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { Avatar } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { listSellersOverview, resetSellerPassword, updateSeller, updateSellerStatus } from '@/services/sellers.service'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso } from '@/utils/period'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerListItem } from '@/types/sellers'
import { SellerEditDialog } from './components/seller-edit-dialog'
import { SellerPasswordDialog } from './components/seller-password-dialog'
import { SellerStatusDialog } from './components/seller-status-dialog'

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value}</span>
    </div>
  )
}

export function SellerDetailPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [range, setRange] = useState(() => ({
    from: firstDayOfPeriodIso(currentPeriod()),
    to: lastDayOfPeriodIso(currentPeriod()),
  }))
  const [seller, setSeller] = useState<SellerListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      const overview = await listSellersOverview(range.from, range.to)
      setSeller(overview.find((item) => item.id === id) ?? null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o vendedor.')
    } finally {
      setLoading(false)
    }
  }, [id, range])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSaveEdit(values: { full_name: string; email: string }) {
    if (!seller) return
    setSavingEdit(true)
    try {
      await updateSeller({ id: seller.id, ...values })
      toast({ title: 'Vendedor atualizado com sucesso.', variant: 'success' })
      setEditOpen(false)
      void load()
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

  async function handleResetPassword(password: string) {
    if (!seller) return
    setSavingPassword(true)
    try {
      await resetSellerPassword({ id: seller.id, password })
      toast({ title: 'Senha alterada com sucesso.', variant: 'success' })
      setPasswordOpen(false)
    } catch (err) {
      toast({
        title: 'Não foi possível alterar a senha.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleConfirmStatus() {
    if (!seller) return
    setSavingStatus(true)
    try {
      await updateSellerStatus(seller.id, !seller.is_active)
      toast({ title: seller.is_active ? 'Vendedor desativado.' : 'Vendedor ativado.', variant: 'success' })
      setStatusOpen(false)
      void load()
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

  if (!id) return null
  if (loading) return <AuthLoading />

  if (loadError) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendedores', href: ROUTES.sellers }]}>
        <ErrorState description={loadError} onRetry={load} />
      </AppShell>
    )
  }

  if (!seller) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendedores', href: ROUTES.sellers }]}>
        <ErrorState
          title="Vendedor não encontrado"
          description="Ele pode não existir ou não ter a role de vendedor."
          onRetry={() => navigate(ROUTES.sellers)}
          retryLabel="Voltar para Vendedores"
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Vendedores', href: ROUTES.sellers },
        { label: seller.full_name, href: ROUTES.sellerDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={seller.full_name} />
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 font-semibold tracking-tight text-foreground">{seller.full_name}</h1>
              <ActiveStatusBadge isActive={seller.is_active} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={ROUTES.sellers} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <KeyRound className="size-4" aria-hidden="true" />
              Alterar senha
            </Button>
            <Button variant={seller.is_active ? 'destructive' : 'primary'} onClick={() => setStatusOpen(true)}>
              {seller.is_active ? (
                <PowerOff className="size-4" aria-hidden="true" />
              ) : (
                <Power className="size-4" aria-hidden="true" />
              )}
              {seller.is_active ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        </div>

        <Card className="rounded-lg p-4 shadow-md">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-foreground">Período</p>
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
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Informações do vendedor</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Nome" value={seller.full_name} />
              <InfoField label="E-mail" value={seller.email ?? '—'} />
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Status</span>
                <ActiveStatusBadge isActive={seller.is_active} />
              </div>
              <InfoField
                label="Posição no ranking"
                value={seller.rank ? `${seller.rank}º de ${seller.totalSellers}` : '—'}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Desempenho no período</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Alunos cadastrados" value={String(seller.studentsCount)} />
              <InfoField label="Matrículas" value={String(seller.enrollmentsCount)} />
              <InfoField label="Valor vendido" value={formatCentsToBRL(Math.round(seller.realizedAmount * 100))} />
              <InfoField
                label="Meta"
                value={seller.goal ? formatCentsToBRL(Math.round(seller.goal.financial_target * 100)) : 'Sem meta cadastrada'}
              />
              <InfoField label="% da meta" value={seller.goal ? `${Math.round(seller.financialPercent)}%` : '—'} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`${ROUTES.reports}?vendedor=${seller.id}`} className={buttonVariants({ variant: 'outline' })}>
            <TrendingUp className="size-4" aria-hidden="true" />
            Ver desempenho detalhado
          </Link>
          <Link to={`${ROUTES.goals}?vendedor=${seller.id}`} className={buttonVariants({ variant: 'outline' })}>
            <Target className="size-4" aria-hidden="true" />
            Ver metas
          </Link>
        </div>
      </div>

      <SellerEditDialog open={editOpen} onOpenChange={setEditOpen} seller={seller} submitting={savingEdit} onSubmit={handleSaveEdit} />

      <SellerPasswordDialog
        seller={passwordOpen ? seller : null}
        onOpenChange={setPasswordOpen}
        submitting={savingPassword}
        onSubmit={handleResetPassword}
      />

      <SellerStatusDialog
        seller={statusOpen ? seller : null}
        onOpenChange={setStatusOpen}
        submitting={savingStatus}
        onConfirm={handleConfirmStatus}
      />
    </AppShell>
  )
}
