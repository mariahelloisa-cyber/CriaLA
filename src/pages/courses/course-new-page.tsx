import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createCourse } from '@/services/courses.service'
import { CourseForm } from './components/course-form'
import { EMPTY_COURSE_FORM_VALUES, type CourseFormValues } from './components/course-form-values'
import { useCourseOptions } from './hooks/use-course-options'

export function CourseNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { categories } = useCourseOptions()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: CourseFormValues) {
    setSubmitting(true)
    try {
      const { id } = await createCourse({
        name: values.name.trim(),
        category_id: values.category_id,
        description: values.description.trim() || null,
        is_active: values.is_active,
        total_units: values.total_units.trim() ? Number(values.total_units) : null,
      })

      toast({ title: 'Curso criado com sucesso.', variant: 'success' })
      navigate(ROUTES.courseDetail(id))
    } catch (err) {
      toast({
        title: 'Não foi possível criar o curso.',
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
        { label: 'Novo curso', href: ROUTES.courseNew },
      ]}
    >
      <PageHeader eyebrow="Cursos" title="Novo curso" description="Cadastre um curso para o catálogo acadêmico." />

      <CourseForm
        mode="create"
        initialValues={EMPTY_COURSE_FORM_VALUES}
        categoryOptions={categories}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.courses)}
      />
    </AppShell>
  )
}
