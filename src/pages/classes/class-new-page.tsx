import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createClass, listActiveCourses, listActiveUnits } from '@/services/classes.service'
import type { Course, Unit } from '@/types/classes'
import { ClassForm } from './components/class-form'
import { EMPTY_CLASS_FORM_VALUES, type ClassFormValues } from './components/class-form-values'

export function ClassNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()

  const [courseOptions, setCourseOptions] = useState<Course[]>([])
  const [unitOptions, setUnitOptions] = useState<Unit[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([listActiveCourses(), listActiveUnits()])
      .then(([courses, units]) => {
        if (!active) return
        setCourseOptions(courses)
        setUnitOptions(units)
      })
      .catch(() => {
        if (active) {
          toast({ title: 'Não foi possível carregar cursos e unidades.', variant: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(values: ClassFormValues) {
    setSubmitting(true)
    try {
      const { id } = await createClass({
        name: values.name.trim(),
        course_id: values.course_id,
        unit_id: values.unit_id,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
        capacity: values.capacity.trim() ? Number(values.capacity) : null,
      })

      toast({ title: 'Turma criada com sucesso.', variant: 'success' })
      navigate(ROUTES.classDetail(id))
    } catch (err) {
      toast({
        title: 'Não foi possível criar a turma.',
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
        { label: 'Turmas', href: ROUTES.classes },
        { label: 'Nova turma', href: ROUTES.classNew },
      ]}
    >
      <PageHeader eyebrow="Turmas" title="Nova turma" description="Cadastre uma turma disponível para matrícula." />

      <ClassForm
        mode="create"
        initialValues={EMPTY_CLASS_FORM_VALUES}
        courseOptions={courseOptions}
        unitOptions={unitOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.classes)}
      />
    </AppShell>
  )
}
