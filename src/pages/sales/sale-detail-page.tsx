import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { Avatar } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { cancelInstallment, deleteSale, getSale, markInstallmentPaid } from '@/services/sales.service'
import { formatCpf } from '@/utils/cpf'
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { SaleDetail, SaleInstallment } from '@/types/sales'
import { InstallmentTable } from './components/installment-table'
import { PAYMENT_METHOD_LABEL } from './components/sale-badges'

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function SaleDetailPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getSale(id)
      setSale(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a venda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleMarkPaid(installment: SaleInstallment) {
    try {
      await markInstallmentPaid(installment.id)
      toast({ title: 'Pagamento registrado com sucesso.', variant: 'success' })
      void load()
    } catch (err) {
      toast({
        title: 'Não foi possível registrar o pagamento.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleCancelInstallment(installment: SaleInstallment) {
    try {
      await cancelInstallment(installment.id)
      toast({ title: 'Parcela cancelada.', variant: 'success' })
      void load()
    } catch (err) {
      toast({
        title: 'Não foi possível cancelar a parcela.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    }
  }

  if (!id) return null
  if (loading) return <AuthLoading />

  if (loadError) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendas', href: ROUTES.sales }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!sale) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Vendas', href: ROUTES.sales }]}>
        <ErrorState
          title="Venda não encontrada"
          description="Ela pode não existir ou você não tem permissão para acessá-la."
          onRetry={() => navigate(ROUTES.sales)}
          retryLabel="Voltar para Vendas"
        />
      </AppShell>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteSale(id!)
      toast({ title: 'Venda excluída com sucesso.', variant: 'success' })
      navigate(ROUTES.sales)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a venda.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Vendas', href: ROUTES.sales },
        { label: sale.student.full_name, href: ROUTES.saleDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={sale.student.full_name} size="lg" />
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 font-semibold tracking-tight text-foreground">Venda de {sale.student.full_name}</h1>
              <span className="text-body-sm text-muted-foreground">{sale.course.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.sales} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            {isManager && (
              <>
                <Link to={ROUTES.saleEdit(id)} className={buttonVariants({ variant: 'outline' })}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Link>
                <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Dados da venda</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Aluno" value={sale.student.full_name} />
              <InfoField label="CPF" value={sale.student.cpf ? formatCpf(sale.student.cpf) : null} />
              <InfoField label="Curso" value={sale.course.name} />
              <InfoField label="Turma" value={sale.class?.name} />
              <InfoField label="Unidade" value={sale.class?.unit?.name} />
              <InfoField label="Vendedor" value={sale.seller?.full_name} />
              <InfoField label="Data da venda" value={formatDateBr(sale.sale_date)} />
              <InfoField label="Forma de pagamento" value={PAYMENT_METHOD_LABEL[sale.payment_method]} />
              <InfoField label="Valor total" value={formatCentsToBRL(Math.round(sale.total_amount * 100))} />
              <InfoField label="Observação" value={sale.payment_plan} />
              <Link to={ROUTES.studentDetail(sale.student.id)} className="text-body-sm text-primary hover:underline">
                Ver perfil do aluno →
              </Link>
              <Link
                to={ROUTES.enrollmentDetail(sale.enrollment_id)}
                className="text-body-sm text-primary hover:underline"
              >
                Ver matrícula →
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Parcelas</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <InstallmentTable
                installments={sale.installments}
                isManager={isManager}
                onMarkPaid={handleMarkPaid}
                onCancel={handleCancelInstallment}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir venda</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir a venda de{' '}
              <strong className="text-foreground">{sale.student.full_name}</strong>? As parcelas vinculadas também
              serão removidas. Esta ação não poderá ser desfeita.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
