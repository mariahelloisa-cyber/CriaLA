import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { formatCpf } from '@/utils/cpf'
import { listAllClassesForCourse, listAvailableClassesForCourse } from '@/services/enrollments.service'
import { ENROLLMENT_STATUS_LABEL, ClassStatusBadge } from '@/pages/students/components/status-badges'
import type { ClassOption, Course, EnrollmentStatus, StudentOption } from '@/types/enrollments'
import { StudentPicker } from './student-picker'
import type { EnrollmentFormValues } from './enrollment-form-values'

const STATUS_OPTIONS: EnrollmentStatus[] = ['active', 'completed', 'cancelled']

interface EnrollmentFormProps {
  mode: 'create' | 'edit'
  initialValues: EnrollmentFormValues
  /** Em modo edição, o aluno não é mais trocável (ver seção "Edição" do relatório) — só exibido. */
  fixedStudent?: StudentOption | null
  courseOptions: Course[]
  submitting: boolean
  onSubmit: (values: EnrollmentFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<keyof EnrollmentFormValues, string>>

export function EnrollmentForm({
  mode,
  initialValues,
  fixedStudent,
  courseOptions,
  submitting,
  onSubmit,
  onCancel,
}: EnrollmentFormProps) {
  const [values, setValues] = useState<EnrollmentFormValues>(initialValues)
  const [student, setStudent] = useState<StudentOption | null>(fixedStudent ?? null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    setStudent(fixedStudent ?? null)
  }, [fixedStudent])

  useEffect(() => {
    if (!values.course_id) {
      setClassOptions([])
      return
    }
    let active = true
    setLoadingClasses(true)
    const fetchClasses = mode === 'edit' ? listAllClassesForCourse : listAvailableClassesForCourse
    fetchClasses(values.course_id)
      .then((data) => {
        if (active) setClassOptions(data)
      })
      .catch(() => {
        if (active) setClassOptions([])
      })
      .finally(() => {
        if (active) setLoadingClasses(false)
      })
    return () => {
      active = false
    }
    // Dispara só quando o curso muda — não a cada render do array de opções.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.course_id])

  const selectedClass = useMemo(
    () => classOptions.find((option) => option.id === values.class_id) ?? null,
    [classOptions, values.class_id],
  )

  function set<K extends keyof EnrollmentFormValues>(key: K, value: EnrollmentFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleCourseChange(courseId: string) {
    setValues((prev) => ({ ...prev, course_id: courseId, class_id: '' }))
    if (errors.course_id) setErrors((prev) => ({ ...prev, course_id: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (mode === 'create' && !student) {
      nextErrors.student_id = 'Selecione um aluno.'
    }
    if (!values.course_id) {
      nextErrors.course_id = 'Selecione um curso.'
    }
    if (!values.class_id) {
      nextErrors.class_id = 'Selecione uma turma.'
    }
    if (!values.enrollment_date) {
      nextErrors.enrollment_date = 'Data da matrícula é obrigatória.'
    }
    if (
      values.expected_graduation_date &&
      values.enrollment_date &&
      values.expected_graduation_date < values.enrollment_date
    ) {
      nextErrors.expected_graduation_date = 'A data prevista de formação não pode ser anterior à matrícula.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    await onSubmit({ ...values, student_id: student?.id ?? values.student_id })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Aluno</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          {mode === 'edit' && fixedStudent ? (
            <div className="flex flex-col gap-1">
              <Text variant="label">Aluno</Text>
              <Text variant="body-sm">
                {fixedStudent.full_name}
                {fixedStudent.cpf ? ` — ${formatCpf(fixedStudent.cpf)}` : ''}
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                O aluno de uma matrícula não pode ser alterado. Para matricular outro aluno, crie uma nova
                matrícula.
              </Text>
            </div>
          ) : (
            <StudentPicker value={student} onChange={setStudent} error={errors.student_id} />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Curso e turma</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <Select
            label="Curso"
            required
            value={values.course_id}
            onChange={(event) => handleCourseChange(event.target.value)}
            error={errors.course_id}
            disabled={courseOptions.length === 0}
            helperText={courseOptions.length === 0 ? 'Nenhum curso cadastrado.' : undefined}
          >
            <option value="">Selecione um curso...</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>

          <Select
            label="Turma"
            required
            value={values.class_id}
            onChange={(event) => set('class_id', event.target.value)}
            error={errors.class_id}
            disabled={!values.course_id || loadingClasses || classOptions.length === 0}
            helperText={
              !values.course_id
                ? 'Selecione um curso primeiro.'
                : !loadingClasses && classOptions.length === 0
                  ? 'Nenhuma turma disponível para este curso.'
                  : undefined
            }
          >
            <option value="">{loadingClasses ? 'Carregando...' : 'Selecione uma turma...'}</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>

          {selectedClass && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-body-sm sm:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Unidade: {selectedClass.unit?.name ?? '—'}</span>
                <ClassStatusBadge status={selectedClass.status} className="rounded-full" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Datas e status</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <DatePicker
            label="Data da matrícula"
            required
            value={values.enrollment_date}
            onChange={(event) => set('enrollment_date', event.target.value)}
            error={errors.enrollment_date}
          />
          <DatePicker
            label="Data prevista de formação"
            value={values.expected_graduation_date}
            onChange={(event) => set('expected_graduation_date', event.target.value)}
            min={values.enrollment_date || undefined}
            error={errors.expected_graduation_date}
          />
          <Select
            label="Status"
            required
            value={values.status}
            onChange={(event) => set('status', event.target.value as EnrollmentStatus)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ENROLLMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : mode === 'create' ? 'Matricular aluno' : 'Salvar matrícula'}
        </Button>
      </div>
    </form>
  )
}
