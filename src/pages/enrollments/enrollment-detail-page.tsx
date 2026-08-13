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
import { deleteEnrollment, getEnrollment, getSaleForEnrollment } from '@/services/enrollments.service'
import { formatCpf } from '@/utils/cpf'
import { formatDateBr } from '@/utils/format-date'
import type { EnrollmentDetail, EnrollmentSaleSummary } from '@/types/enrollments'
import { ClassStatusBadge, EnrollmentStatusBadge } from '@/pages/students/components/status-badges'
import { PAYMENT_METHOD_LABEL } from '@/pages/sales/components/sale-badges'

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function EnrollmentDetailPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null)
  const [sale, setSale] = useState<EnrollmentSaleSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getEnrollment(id!)
        if (!active) return
        setEnrollment(data)
        if (data) {
          const saleData = await getSaleForEnrollment(data.id).catch(() => null)
          if (active) setSale(saleData)
        }
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a matrícula.')
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
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Matrículas', href: ROUTES.enrollments }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!enrollment) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Matrículas', href: ROUTES.enrollments }]}>
        <ErrorState
          title="Matrícula não encontrada"
          description="Ela pode não existir ou você não tem permissão para acessá-la."
          onRetry={() => navigate(ROUTES.enrollments)}
          retryLabel="Voltar para Matrículas"
        />
      </AppShell>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteEnrollment(id!)
      toast({ title: 'Matrícula excluída com sucesso.', variant: 'success' })
      navigate(ROUTES.enrollments)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a matrícula.',
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
        { label: 'Matrículas', href: ROUTES.enrollments },
        { label: enrollment.student.full_name, href: ROUTES.enrollmentDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={enrollment.student.full_name} size="lg" />
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 font-semibold tracking-tight text-foreground">{enrollment.student.full_name}</h1>
              <EnrollmentStatusBadge status={enrollment.status} className="rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.enrollments} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            {isManager && (
              <>
                <Link to={ROUTES.enrollmentEdit(id)} className={buttonVariants({ variant: 'outline' })}>
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
              <CardTitle className="text-body">Dados do aluno</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Nome" value={enrollment.student.full_name} />
              <InfoField label="CPF" value={enrollment.student.cpf ? formatCpf(enrollment.student.cpf) : null} />
              <InfoField label="E-mail" value={enrollment.student.email} />
              <InfoField label="Telefone" value={enrollment.student.phone} />
              <Link to={ROUTES.studentDetail(enrollment.student.id)} className="text-body-sm text-primary hover:underline">
                Ver perfil completo do aluno →
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Dados acadêmicos</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Curso" value={enrollment.class?.course?.name} />
              <InfoField label="Categoria" value={enrollment.class?.course?.category?.name} />
              <InfoField label="Turma" value={enrollment.class?.name} />
              <InfoField label="Unidade" value={enrollment.class?.unit?.name} />
              <InfoField label="Data da matrícula" value={formatDateBr(enrollment.enrollmentDate)} />
              <InfoField label="Previsão de formação" value={formatDateBr(enrollment.expectedGraduationDate)} />
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Status da matrícula</span>
                <EnrollmentStatusBadge status={enrollment.status} className="rounded-full" />
              </div>
              {enrollment.class && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Status da turma</span>
                  <ClassStatusBadge status={enrollment.class.status} className="rounded-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-body">Informações comerciais</CardTitle>
              {sale ? (
                <Link to={ROUTES.saleDetail(sale.id)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Ver venda
                </Link>
              ) : (
                isManager && (
                  <Link to={ROUTES.saleNew} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Registrar venda
                  </Link>
                )
              )}
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {sale ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  <InfoField
                    label="Valor"
                    value={sale.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <InfoField
                    label="Forma de pagamento"
                    value={
                      PAYMENT_METHOD_LABEL[sale.payment_method as keyof typeof PAYMENT_METHOD_LABEL] ??
                      sale.payment_method
                    }
                  />
                  <InfoField label="Data da venda" value={formatDateBr(sale.sale_date)} />
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">Nenhuma venda vinculada a esta matrícula.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir matrícula</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir a matrícula de{' '}
              <strong className="text-foreground">{enrollment.student.full_name}</strong>? Esta ação não poderá ser
              desfeita.
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
