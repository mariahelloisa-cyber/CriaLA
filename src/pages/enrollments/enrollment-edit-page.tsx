import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { listCourses } from '@/services/classes.service'
import { getEnrollment, updateEnrollment } from '@/services/enrollments.service'
import type { Course, EnrollmentDetail } from '@/types/enrollments'
import { EnrollmentForm } from './components/enrollment-form'
import { EMPTY_ENROLLMENT_FORM_VALUES, type EnrollmentFormValues } from './components/enrollment-form-values'

export function EnrollmentEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null)
  const [courseOptions, setCourseOptions] = useState<Course[]>([])
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
        const [data, courses] = await Promise.all([getEnrollment(id!), listCourses()])
        if (!active) return
        setEnrollment(data)
        setCourseOptions(courses)
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
          description="Ela pode não existir ou ter sido removida."
          onRetry={() => navigate(ROUTES.enrollments)}
          retryLabel="Voltar para Matrículas"
        />
      </AppShell>
    )
  }

  const initialValues: EnrollmentFormValues = {
    ...EMPTY_ENROLLMENT_FORM_VALUES,
    student_id: enrollment.student.id,
    course_id: enrollment.class?.course?.id ?? '',
    class_id: enrollment.class?.id ?? '',
    enrollment_date: enrollment.enrollmentDate,
    expected_graduation_date: enrollment.expectedGraduationDate ?? '',
    status: enrollment.status,
  }

  async function handleSubmit(values: EnrollmentFormValues) {
    setSubmitting(true)
    try {
      await updateEnrollment(id!, {
        class_id: values.class_id,
        enrollment_date: values.enrollment_date,
        expected_graduation_date: values.expected_graduation_date || null,
        status: values.status,
      })

      toast({ title: 'Matrícula atualizada com sucesso.', variant: 'success' })
      navigate(ROUTES.enrollmentDetail(id!))
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
        { label: 'Matrículas', href: ROUTES.enrollments },
        { label: enrollment.student.full_name, href: ROUTES.enrollmentDetail(id) },
        { label: 'Editar', href: ROUTES.enrollmentEdit(id) },
      ]}
    >
      <PageHeader
        eyebrow="Matrículas"
        title={`Editar matrícula de ${enrollment.student.full_name}`}
        description="Atualize os dados acadêmicos desta matrícula."
      />

      <EnrollmentForm
        mode="edit"
        initialValues={initialValues}
        fixedStudent={enrollment.student}
        courseOptions={courseOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.enrollmentDetail(id))}
      />
    </AppShell>
  )
}
