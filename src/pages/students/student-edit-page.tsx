import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { getStudentById, listAllClasses, updateEnrollment, updateStudent } from '@/services/students.service'
import type { ClassOption, StudentDetail } from '@/types/students'
import { StudentForm } from './components/student-form'
import { EMPTY_STUDENT_FORM_VALUES, type StudentFormValues } from './components/student-form-values'

export function StudentEditPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
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
        const [studentData, classes] = await Promise.all([getStudentById(id!), listAllClasses()])
        if (!active) return
        setStudent(studentData)
        setClassOptions(classes)
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

  const currentEnrollment = student.enrollments[0] ?? null

  const initialValues: StudentFormValues = {
    ...EMPTY_STUDENT_FORM_VALUES,
    full_name: student.full_name,
    birth_date: student.birth_date ?? '',
    father_name: student.father_name ?? '',
    mother_name: student.mother_name ?? '',
    rg: student.rg ?? '',
    cpf: student.cpf ?? '',
    phone: student.phone ?? '',
    email: student.email ?? '',
    cep: student.cep ?? '',
    address: student.address ?? '',
    number: student.number ?? '',
    complement: student.complement ?? '',
    neighborhood: student.neighborhood ?? '',
    city: student.city ?? '',
    state: student.state ?? '',
    class_id: currentEnrollment?.class_id ?? '',
    enrollment_date: currentEnrollment?.enrollment_date ?? '',
    expected_graduation_date: currentEnrollment?.expected_graduation_date ?? '',
  }

  async function handleSubmit(values: StudentFormValues) {
    setSubmitting(true)
    try {
      await updateStudent(id!, {
        full_name: values.full_name.trim(),
        birth_date: values.birth_date || null,
        father_name: values.father_name || null,
        mother_name: values.mother_name || null,
        rg: values.rg || null,
        cpf: values.cpf || null,
        phone: values.phone || null,
        email: values.email || null,
        cep: values.cep || null,
        address: values.address || null,
        number: values.number || null,
        complement: values.complement || null,
        neighborhood: values.neighborhood || null,
        city: values.city || null,
        state: values.state || null,
      })

      // PDF/RLS: só gerente edita dados da matrícula (enrollments_update_manager).
      if (isManager && currentEnrollment) {
        await updateEnrollment(currentEnrollment.id, {
          class_id: values.class_id || undefined,
          enrollment_date: values.enrollment_date || undefined,
          expected_graduation_date: values.expected_graduation_date || null,
        })
      }

      toast({ title: 'Alterações salvas com sucesso.', variant: 'success' })
      navigate(ROUTES.studentDetail(id!))
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
        { label: 'Alunos', href: ROUTES.students },
        { label: student.full_name, href: ROUTES.studentDetail(id) },
        { label: 'Editar', href: ROUTES.studentEdit(id) },
      ]}
    >
      <PageHeader eyebrow="Alunos" title={`Editar ${student.full_name}`} description="Atualize os dados do aluno." />

      <StudentForm
        mode="edit"
        studentId={id}
        initialValues={initialValues}
        classOptions={classOptions}
        canEditAcademic={isManager}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.studentDetail(id))}
      />
    </AppShell>
  )
}
