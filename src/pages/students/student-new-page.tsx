import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createStudentWithEnrollment, listAvailableClasses } from '@/services/students.service'
import type { ClassOption } from '@/types/students'
import { StudentForm } from './components/student-form'
import { EMPTY_STUDENT_FORM_VALUES, type StudentFormValues } from './components/student-form-values'

export function StudentNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()

  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    listAvailableClasses()
      .then((classes) => {
        if (active) setClassOptions(classes)
      })
      .catch(() => {
        if (active) {
          toast({ title: 'Não foi possível carregar as turmas disponíveis.', variant: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(values: StudentFormValues) {
    setSubmitting(true)
    try {
      const { studentId } = await createStudentWithEnrollment(
        {
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
        },
        {
          class_id: values.class_id,
          enrollment_date: values.enrollment_date || undefined,
          expected_graduation_date: values.expected_graduation_date || null,
        },
      )

      toast({ title: 'Aluno cadastrado com sucesso.', variant: 'success' })
      navigate(ROUTES.studentDetail(studentId))
    } catch (err) {
      toast({
        title: 'Não foi possível cadastrar o aluno.',
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
        { label: 'Novo aluno', href: ROUTES.studentNew },
      ]}
    >
      <PageHeader
        eyebrow="Alunos"
        title="Novo aluno"
        description="Preencha os dados pessoais, endereço e a matrícula do aluno."
      />

      <StudentForm
        mode="create"
        initialValues={EMPTY_STUDENT_FORM_VALUES}
        classOptions={classOptions}
        canEditAcademic
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.students)}
      />
    </AppShell>
  )
}
