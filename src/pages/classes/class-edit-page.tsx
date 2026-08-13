import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { getClass, listCourses, listUnits, updateClass } from '@/services/classes.service'
import type { ClassDetail, Course, Unit } from '@/types/classes'
import { ClassForm } from './components/class-form'
import { EMPTY_CLASS_FORM_VALUES, type ClassFormValues } from './components/class-form-values'

export function ClassEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [classItem, setClassItem] = useState<ClassDetail | null>(null)
  const [courseOptions, setCourseOptions] = useState<Course[]>([])
  const [unitOptions, setUnitOptions] = useState<Unit[]>([])
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
        // Carrega todos os cursos/unidades (não só ativos) para que o curso/
        // unidade atualmente selecionados continuem aparecendo como opção
        // válida mesmo que tenham sido desativados depois (mesmo raciocínio
        // usado em student-edit-page.tsx para turmas encerradas).
        const [classData, courses, units] = await Promise.all([getClass(id!), listCourses(), listUnits()])
        if (!active) return
        setClassItem(classData)
        setCourseOptions(courses)
        setUnitOptions(units)
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

  const initialValues: ClassFormValues = {
    ...EMPTY_CLASS_FORM_VALUES,
    name: classItem.name,
    course_id: classItem.course?.id ?? '',
    unit_id: classItem.unit?.id ?? '',
    start_date: classItem.start_date,
    end_date: classItem.end_date,
    status: classItem.status,
    capacity: classItem.capacity != null ? String(classItem.capacity) : '',
  }

  async function handleSubmit(values: ClassFormValues) {
    setSubmitting(true)
    try {
      await updateClass(id!, {
        name: values.name.trim(),
        course_id: values.course_id,
        unit_id: values.unit_id,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
        capacity: values.capacity.trim() ? Number(values.capacity) : null,
      })

      toast({ title: 'Turma atualizada com sucesso.', variant: 'success' })
      navigate(ROUTES.classDetail(id!))
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
        { label: 'Turmas', href: ROUTES.classes },
        { label: classItem.name, href: ROUTES.classDetail(id) },
        { label: 'Editar', href: ROUTES.classEdit(id) },
      ]}
    >
      <PageHeader eyebrow="Turmas" title={`Editar ${classItem.name}`} description="Atualize os dados da turma." />

      <ClassForm
        mode="edit"
        initialValues={initialValues}
        courseOptions={courseOptions}
        unitOptions={unitOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.classDetail(id))}
      />
    </AppShell>
  )
}
