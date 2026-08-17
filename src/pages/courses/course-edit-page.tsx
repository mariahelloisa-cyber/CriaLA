import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { getCourse, updateCourse } from '@/services/courses.service'
import type { CourseDetail } from '@/types/courses'
import { CourseForm } from './components/course-form'
import { EMPTY_COURSE_FORM_VALUES, type CourseFormValues } from './components/course-form-values'
import { useCourseOptions } from './hooks/use-course-options'

export function CourseEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { categories } = useCourseOptions()

  const [course, setCourse] = useState<CourseDetail | null>(null)
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
        const data = await getCourse(id!)
        if (active) setCourse(data)
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o curso.')
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
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Cursos', href: ROUTES.courses }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!course) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Cursos', href: ROUTES.courses }]}>
        <ErrorState
          title="Curso não encontrado"
          description="Ele pode não existir ou ter sido removido."
          onRetry={() => navigate(ROUTES.courses)}
          retryLabel="Voltar para Cursos"
        />
      </AppShell>
    )
  }

  const initialValues: CourseFormValues = {
    ...EMPTY_COURSE_FORM_VALUES,
    name: course.name,
    category_id: course.category?.id ?? '',
    description: course.description ?? '',
    is_active: course.is_active,
    total_units: course.total_units != null ? String(course.total_units) : '',
  }

  async function handleSubmit(values: CourseFormValues) {
    setSubmitting(true)
    try {
      await updateCourse(id!, {
        name: values.name.trim(),
        category_id: values.category_id,
        description: values.description.trim() || null,
        is_active: values.is_active,
        total_units: values.total_units.trim() ? Number(values.total_units) : null,
      })

      toast({ title: 'Curso atualizado com sucesso.', variant: 'success' })
      navigate(ROUTES.courseDetail(id!))
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
        { label: 'Cursos', href: ROUTES.courses },
        { label: course.name, href: ROUTES.courseDetail(id) },
        { label: 'Editar', href: ROUTES.courseEdit(id) },
      ]}
    >
      <PageHeader eyebrow="Cursos" title={`Editar ${course.name}`} description="Atualize os dados do curso." />

      <CourseForm
        mode="edit"
        initialValues={initialValues}
        categoryOptions={categories}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.courseDetail(id))}
      />
    </AppShell>
  )
}
