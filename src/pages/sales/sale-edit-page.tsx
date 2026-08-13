import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { getSale, updateSale } from '@/services/sales.service'
import { formatCentsToBRL } from '@/utils/currency'
import type { SaleDetail } from '@/types/sales'
import { PAYMENT_METHOD_LABEL } from './components/sale-badges'

export function SaleEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saleDate, setSaleDate] = useState('')
  const [paymentPlan, setPaymentPlan] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getSale(id!)
        if (!active) return
        setSale(data)
        setSaleDate(data?.sale_date ?? '')
        setPaymentPlan(data?.payment_plan ?? '')
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a venda.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

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
          description="Ela pode não existir ou ter sido removida."
          onRetry={() => navigate(ROUTES.sales)}
          retryLabel="Voltar para Vendas"
        />
      </AppShell>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await updateSale(id!, { sale_date: saleDate, payment_plan: paymentPlan.trim() || null })
      toast({ title: 'Venda atualizada com sucesso.', variant: 'success' })
      navigate(ROUTES.saleDetail(id!))
    } catch (err) {
      toast({
        title: 'Não foi possível salvar as alterações.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Vendas', href: ROUTES.sales },
        { label: sale.student.full_name, href: ROUTES.saleDetail(id) },
        { label: 'Editar', href: ROUTES.saleEdit(id) },
      ]}
    >
      <PageHeader
        eyebrow="Vendas"
        title={`Editar venda de ${sale.student.full_name}`}
        description="Apenas a data da venda e a observação do plano de pagamento podem ser alteradas."
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados comerciais</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-3 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Valor</span>
                <span className="text-body-sm text-foreground">
                  {formatCentsToBRL(Math.round(sale.total_amount * 100))}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Forma de pagamento</span>
                <span className="text-body-sm text-foreground">{PAYMENT_METHOD_LABEL[sale.payment_method]}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Parcelas</span>
                <span className="text-body-sm text-foreground">{sale.installments.length}x</span>
              </div>
            </div>
            <Text variant="caption" className="text-muted-foreground">
              Valor, forma de pagamento e parcelas não são editáveis aqui: alterá-los dessincronizaria as parcelas já
              criadas, e o PDF não define uma regra de recálculo. Para corrigir esses dados, exclua a venda e
              registre-a novamente.
            </Text>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DatePicker
                label="Data da venda"
                required
                value={saleDate}
                onChange={(event) => setSaleDate(event.target.value)}
              />
              <Input
                label="Observação sobre o plano de pagamento"
                placeholder="Opcional"
                value={paymentPlan}
                onChange={(event) => setPaymentPlan(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.saleDetail(id))} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Salvando...' : 'Salvar venda'}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
