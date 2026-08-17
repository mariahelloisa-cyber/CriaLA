import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createTeacher, setTeacherClasses, uploadTeacherContract } from '@/services/teachers.service'
import { TeacherForm } from './components/teacher-form'
import { EMPTY_TEACHER_FORM_VALUES, type TeacherFormValues } from './components/teacher-form-values'
import { useTeacherClassOptions } from './hooks/use-teacher-class-options'

export function TeacherNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { classes } = useTeacherClassOptions()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: TeacherFormValues) {
    setSubmitting(true)
    try {
      const { id } = await createTeacher({
        full_name: values.full_name.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        subject_area: values.subject_area.trim(),
        is_active: values.is_active,
      })

      if (values.classIds.length > 0) {
        await setTeacherClasses(id, values.classIds)
      }
      if (values.contractFile) {
        await uploadTeacherContract(id, values.contractFile)
      }

      toast({ title: 'Professor cadastrado com sucesso.', variant: 'success' })
      navigate(ROUTES.teacherDetail(id))
    } catch (err) {
      toast({
        title: 'Não foi possível cadastrar o professor.',
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
        { label: 'Novo professor', href: ROUTES.teacherNew },
      ]}
    >
      <PageHeader
        eyebrow="Professores"
        title="Novo professor"
        description="Cadastre um professor, o contrato e as turmas que ele administra."
      />

      <TeacherForm
        mode="create"
        initialValues={EMPTY_TEACHER_FORM_VALUES}
        classOptions={classes}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.teachers)}
      />
    </AppShell>
  )
}
