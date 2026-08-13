import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { listActiveCourses } from '@/services/classes.service'
import { createEnrollment } from '@/services/enrollments.service'
import type { Course } from '@/types/enrollments'
import { EnrollmentForm } from './components/enrollment-form'
import { EMPTY_ENROLLMENT_FORM_VALUES, type EnrollmentFormValues } from './components/enrollment-form-values'

export function EnrollmentNewPage() {
  const shellUser = useShellUser()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [courseOptions, setCourseOptions] = useState<Course[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    listActiveCourses()
      .then((courses) => {
        if (active) setCourseOptions(courses)
      })
      .catch(() => {
        if (active) {
          toast({ title: 'Não foi possível carregar os cursos disponíveis.', variant: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(values: EnrollmentFormValues) {
    if (!profile) return
    setSubmitting(true)
    try {
      const { id } = await createEnrollment({
        student_id: values.student_id,
        class_id: values.class_id,
        enrollment_date: values.enrollment_date,
        expected_graduation_date: values.expected_graduation_date || null,
        status: values.status,
        created_by: profile.id,
      })

      toast({ title: 'Matrícula criada com sucesso.', variant: 'success' })
      navigate(ROUTES.enrollmentDetail(id))
    } catch (err) {
      toast({
        title: 'Não foi possível criar a matrícula.',
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
        { label: 'Matrículas', href: ROUTES.enrollments },
        { label: 'Nova matrícula', href: ROUTES.enrollmentNew },
      ]}
    >
      <PageHeader
        eyebrow="Matrículas"
        title="Nova matrícula"
        description="Selecione o aluno, o curso e a turma para registrar a matrícula."
      />

      <EnrollmentForm
        mode="create"
        initialValues={EMPTY_ENROLLMENT_FORM_VALUES}
        courseOptions={courseOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.enrollments)}
      />
    </AppShell>
  )
}
