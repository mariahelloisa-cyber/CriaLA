import { useEffect, useState } from 'react'
import { ArrowLeft, Download, FileText, GraduationCap, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import {
  deleteTeacher,
  getTeacher,
  getTeacherContractSignedUrl,
  listClassesForTeacher,
} from '@/services/teachers.service'
import type { TeacherClassSummary, TeacherDetail } from '@/types/teachers'
import { ClassStatusBadge } from '@/pages/students/components/status-badges'

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function TeacherDetailPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [classes, setClasses] = useState<TeacherClassSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingContract, setDownloadingContract] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const teacherData = await getTeacher(id!)
        if (!active) return
        setTeacher(teacherData)
        if (teacherData) {
          const classesData = await listClassesForTeacher(teacherData.id).catch(() => [])
          if (active) setClasses(classesData)
        }
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o professor.')
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
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Professores', href: ROUTES.teachers }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!teacher) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Professores', href: ROUTES.teachers }]}>
        <ErrorState
          title="Professor não encontrado"
          description="Ele pode não existir ou ter sido removido."
          onRetry={() => navigate(ROUTES.teachers)}
          retryLabel="Voltar para Professores"
        />
      </AppShell>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTeacher(id!, teacher!.contract_file_path)
      toast({ title: 'Professor excluído com sucesso.', variant: 'success' })
      navigate(ROUTES.teachers)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir o professor.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  async function handleDownloadContract() {
    if (!teacher?.contract_file_path) return
    setDownloadingContract(true)
    try {
      const url = await getTeacherContractSignedUrl(teacher.contract_file_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'Não foi possível abrir o contrato.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setDownloadingContract(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Professores', href: ROUTES.teachers },
        { label: teacher.full_name, href: ROUTES.teacherDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">{teacher.full_name}</h1>
            <ActiveStatusBadge isActive={teacher.is_active} className="rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.teachers} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            <Link to={ROUTES.teacherEdit(id)} className={buttonVariants({ variant: 'outline' })}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Informações do professor</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <InfoField label="Área / disciplina" value={teacher.subject_area} />
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Status</span>
                <ActiveStatusBadge isActive={teacher.is_active} className="rounded-full" />
              </div>
              <InfoField label="E-mail" value={teacher.email} />
              <InfoField label="Telefone" value={teacher.phone} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Contrato</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {teacher.contract_file_path ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-body-sm text-foreground">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{teacher.contract_file_name}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={handleDownloadContract} loading={downloadingContract}>
                    <Download className="size-4" aria-hidden="true" />
                    Baixar
                  </Button>
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">Nenhum contrato anexado.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-body">
                <GraduationCap className="size-4" aria-hidden="true" />
                Turmas administradas
                <span className="text-body-sm font-normal text-muted-foreground">({classes.length})</span>
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {classes.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">Este professor não administra nenhuma turma ainda.</p>
              ) : (
                <ul className="flex flex-col">
                  {classes.map((klass, index) => (
                    <li key={klass.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <Link
                        to={ROUTES.classDetail(klass.id)}
                        className="flex items-center justify-between gap-2 py-1 hover:underline"
                      >
                        <span className="text-body-sm text-foreground">{klass.name}</span>
                        <ClassStatusBadge status={klass.status} className="rounded-full" />
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
            <DialogTitle>Excluir professor</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{teacher.full_name}</strong>? Esta
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
