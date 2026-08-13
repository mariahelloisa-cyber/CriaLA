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
import { deleteStudent, getStudentById, listSalesForStudent, type StudentSaleSummary } from '@/services/students.service'
import { formatCpf } from '@/utils/cpf'
import { formatDateBr } from '@/utils/format-date'
import type { StudentDetail } from '@/types/students'
import { ClassStatusBadge, EnrollmentStatusBadge } from './components/status-badges'

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'À vista',
  credit_card: 'Cartão de crédito',
  bank_slip: 'Boleto bancário',
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function StudentDetailPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [sales, setSales] = useState<StudentSaleSummary[]>([])
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
        const studentData = await getStudentById(id!)
        if (!active) return
        setStudent(studentData)
        if (studentData) {
          const salesData = await listSalesForStudent(studentData.id).catch(() => [])
          if (active) setSales(salesData)
        }
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o aluno.')
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
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Alunos', href: ROUTES.students }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!student) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Alunos', href: ROUTES.students }]}>
        <ErrorState
          title="Aluno não encontrado"
          description="Ele pode não existir ou você não tem permissão para acessá-lo."
          onRetry={() => navigate(ROUTES.students)}
          retryLabel="Voltar para Alunos"
        />
      </AppShell>
    )
  }

  const enrollment = student.enrollments[0] ?? null

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteStudent(id!)
      toast({ title: 'Aluno excluído com sucesso.', variant: 'success' })
      navigate(ROUTES.students)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir o aluno.',
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
        { label: 'Alunos', href: ROUTES.students },
        { label: student.full_name, href: ROUTES.studentDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={student.full_name} size="lg" />
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 font-semibold tracking-tight text-foreground">{student.full_name}</h1>
              {enrollment && <EnrollmentStatusBadge status={enrollment.status} className="rounded-full" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.students} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            <Link to={ROUTES.studentEdit(id)} className={buttonVariants({ variant: 'outline' })}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
            {isManager && (
              <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Dados pessoais</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Data de nascimento" value={formatDateBr(student.birth_date)} />
              <InfoField label="CPF" value={student.cpf ? formatCpf(student.cpf) : null} />
              <InfoField label="RG" value={student.rg} />
              <InfoField label="Telefone" value={student.phone} />
              <InfoField label="E-mail" value={student.email} />
              <InfoField label="Nome do pai" value={student.father_name} />
              <InfoField label="Nome da mãe" value={student.mother_name} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Endereço</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="CEP" value={student.cep} />
              <InfoField label="Endereço" value={student.address} />
              <InfoField label="Número" value={student.number} />
              <InfoField label="Complemento" value={student.complement} />
              <InfoField label="Bairro" value={student.neighborhood} />
              <InfoField label="Cidade" value={student.city} />
              <InfoField label="Estado" value={student.state} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-body">Formação acadêmica</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {enrollment ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <InfoField label="Curso" value={enrollment.class?.course?.name} />
                  <InfoField label="Categoria" value={enrollment.class?.course?.category?.name} />
                  <InfoField label="Turma" value={enrollment.class?.name} />
                  <InfoField label="Unidade" value={enrollment.class?.unit?.name} />
                  <InfoField label="Data da matrícula" value={formatDateBr(enrollment.enrollment_date)} />
                  <InfoField
                    label="Data prevista de formação"
                    value={formatDateBr(enrollment.expected_graduation_date)}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-muted-foreground">Status da matrícula</span>
                    <EnrollmentStatusBadge status={enrollment.status} className="rounded-full" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-muted-foreground">Status da turma</span>
                    {enrollment.class && <ClassStatusBadge status={enrollment.class.status} className="rounded-full" />}
                  </div>
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">Nenhuma matrícula encontrada para este aluno.</p>
              )}
            </CardContent>
          </Card>

          {sales.length > 0 && (
            <Card className="rounded-lg shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-body">Informações comerciais</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-3 pt-5">
                {sales.map((sale, index) => (
                  <div key={sale.id}>
                    {index > 0 && <Separator className="mb-3" />}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      <InfoField
                        label="Valor"
                        value={sale.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      />
                      <InfoField
                        label="Forma de pagamento"
                        value={PAYMENT_METHOD_LABEL[sale.payment_method] ?? sale.payment_method}
                      />
                      <InfoField label="Data da venda" value={formatDateBr(sale.sale_date)} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir aluno</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{student.full_name}</strong>? Esta
              ação não pode ser desfeita.
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
