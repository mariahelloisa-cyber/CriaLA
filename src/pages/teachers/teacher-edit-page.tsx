import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import {
  deleteTeacherContract,
  getTeacher,
  getTeacherContractSignedUrl,
  listClassesForTeacher,
  setTeacherClasses,
  updateTeacher,
  uploadTeacherContract,
} from '@/services/teachers.service'
import type { TeacherDetail } from '@/types/teachers'
import { TeacherForm } from './components/teacher-form'
import { EMPTY_TEACHER_FORM_VALUES, type TeacherFormValues } from './components/teacher-form-values'
import { useTeacherClassOptions } from './hooks/use-teacher-class-options'

export function TeacherEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { classes } = useTeacherClassOptions()

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [classIds, setClassIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getTeacher(id!)
        if (!active) return
        setTeacher(data)
        if (data) {
          const teacherClasses = await listClassesForTeacher(data.id).catch(() => [])
          if (active) setClassIds(teacherClasses.map((klass) => klass.id))
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

  const initialValues: TeacherFormValues = {
    ...EMPTY_TEACHER_FORM_VALUES,
    full_name: teacher.full_name,
    email: teacher.email ?? '',
    phone: teacher.phone ?? '',
    subject_area: teacher.subject_area,
    is_active: teacher.is_active,
    classIds,
  }

  async function handleDownloadContract() {
    if (!teacher?.contract_file_path) return
    try {
      const url = await getTeacherContractSignedUrl(teacher.contract_file_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'Não foi possível abrir o contrato.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleSubmit(values: TeacherFormValues) {
    setSubmitting(true)
    try {
      await updateTeacher(id!, {
        full_name: values.full_name.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        subject_area: values.subject_area.trim(),
        is_active: values.is_active,
      })

      await setTeacherClasses(id!, values.classIds)

      if (values.contractFile) {
        await uploadTeacherContract(id!, values.contractFile, teacher!.contract_file_path)
      } else if (values.removeContract && teacher!.contract_file_path) {
        await deleteTeacherContract(id!, teacher!.contract_file_path)
      }

      toast({ title: 'Professor atualizado com sucesso.', variant: 'success' })
      navigate(ROUTES.teacherDetail(id!))
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
        { label: 'Professores', href: ROUTES.teachers },
        { label: teacher.full_name, href: ROUTES.teacherDetail(id) },
        { label: 'Editar', href: ROUTES.teacherEdit(id) },
      ]}
    >
      <PageHeader eyebrow="Professores" title={`Editar ${teacher.full_name}`} description="Atualize os dados do professor." />

      <TeacherForm
        mode="edit"
        initialValues={initialValues}
        classOptions={classes}
        existingContractFileName={teacher.contract_file_name}
        onDownloadContract={teacher.contract_file_path ? handleDownloadContract : undefined}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.teacherDetail(id))}
      />
    </AppShell>
  )
}
