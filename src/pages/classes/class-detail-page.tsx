import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { deleteClass, getClass, listEnrollmentsForClass } from '@/services/classes.service'
import { formatDateBr } from '@/utils/format-date'
import type { ClassDetail, ClassEnrollmentSummary } from '@/types/classes'
import { ClassStatusBadge, EnrollmentStatusBadge } from '@/pages/students/components/status-badges'

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function ClassDetailPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [classItem, setClassItem] = useState<ClassDetail | null>(null)
  const [enrollments, setEnrollments] = useState<ClassEnrollmentSummary[]>([])
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
        const classData = await getClass(id!)
        if (!active) return
        setClassItem(classData)
        if (classData) {
          const enrollmentsData = await listEnrollmentsForClass(classData.id).catch(() => [])
          if (active) setEnrollments(enrollmentsData)
        }
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a turma.')
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
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Turmas', href: ROUTES.classes }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!classItem) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Turmas', href: ROUTES.classes }]}>
        <ErrorState
          title="Turma não encontrada"
          description="Ela pode não existir ou ter sido removida."
          onRetry={() => navigate(ROUTES.classes)}
          retryLabel="Voltar para Turmas"
        />
      </AppShell>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteClass(id!)
      toast({ title: 'Turma excluída com sucesso.', variant: 'success' })
      navigate(ROUTES.classes)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a turma.',
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
        { label: 'Turmas', href: ROUTES.classes },
        { label: classItem.name, href: ROUTES.classDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">{classItem.name}</h1>
            <ClassStatusBadge status={classItem.status} className="rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.classes} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            {isManager && (
              <>
                <Link to={ROUTES.classEdit(id)} className={buttonVariants({ variant: 'outline' })}>
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
              <CardTitle className="text-body">Informações da turma</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Curso" value={classItem.course?.name} />
              <InfoField label="Categoria" value={classItem.course?.category?.name} />
              <InfoField label="Unidade" value={classItem.unit?.name} />
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Status</span>
                <ClassStatusBadge status={classItem.status} className="rounded-full" />
              </div>
              <InfoField label="Data de início" value={formatDateBr(classItem.start_date)} />
              <InfoField label="Data de término" value={formatDateBr(classItem.end_date)} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-body">
                <Users className="size-4" aria-hidden="true" />
                Alunos matriculados
                <span className="text-body-sm font-normal text-muted-foreground">({enrollments.length})</span>
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {enrollments.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">Nenhum aluno matriculado nesta turma ainda.</p>
              ) : (
                <ul className="flex flex-col">
                  {enrollments.map((enrollment, index) => (
                    <li key={enrollment.enrollmentId}>
                      {index > 0 && <Separator className="my-2" />}
                      <Link
                        to={ROUTES.studentDetail(enrollment.studentId)}
                        className="flex items-center justify-between gap-2 py-1 hover:underline"
                      >
                        <span className="text-body-sm text-foreground">{enrollment.studentName}</span>
                        <EnrollmentStatusBadge status={enrollment.status} className="rounded-full" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir turma</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{classItem.name}</strong>? Esta
              ação não poderá ser desfeita.
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
