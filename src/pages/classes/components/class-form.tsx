import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { ClassStatus, Course, Unit } from '@/types/classes'
import { CLASS_STATUS_LABEL } from '@/pages/students/components/status-badges'
import type { ClassFormValues } from './class-form-values'

const STATUS_OPTIONS: ClassStatus[] = ['open', 'in_progress', 'closed']

interface ClassFormProps {
  mode: 'create' | 'edit'
  initialValues: ClassFormValues
  courseOptions: Course[]
  unitOptions: Unit[]
  submitting: boolean
  onSubmit: (values: ClassFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<keyof ClassFormValues, string>>

export function ClassForm({
  mode,
  initialValues,
  courseOptions,
  unitOptions,
  submitting,
  onSubmit,
  onCancel,
}: ClassFormProps) {
  const [values, setValues] = useState<ClassFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function set<K extends keyof ClassFormValues>(key: K, value: ClassFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Nome da turma é obrigatório.'
    }
    if (!values.course_id) {
      nextErrors.course_id = 'Selecione um curso.'
    }
    if (!values.unit_id) {
      nextErrors.unit_id = 'Selecione uma unidade.'
    }
    if (!values.start_date) {
      nextErrors.start_date = 'Data de início é obrigatória.'
    }
    if (!values.end_date) {
      nextErrors.end_date = 'Data de término é obrigatória.'
    }
    if (values.start_date && values.end_date && values.end_date < values.start_date) {
      nextErrors.end_date = 'A data de término deve ser igual ou posterior à data de início.'
    }
    if (values.capacity.trim() && (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) <= 0)) {
      nextErrors.capacity = 'Informe um número inteiro maior que zero, ou deixe em branco.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Informações da turma</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <Input
            label="Nome da turma"
            required
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            error={errors.name}
            containerClassName="sm:col-span-2"
          />

          {courseOptions.length === 0 && (
            <Alert variant="warning" className="sm:col-span-2">
              <AlertDescription className="text-foreground">
                Nenhum curso cadastrado. Cadastre um curso antes de criar uma turma.
              </AlertDescription>
            </Alert>
          )}
          <Select
            label="Curso"
            required
            value={values.course_id}
            onChange={(event) => set('course_id', event.target.value)}
            error={errors.course_id}
            disabled={courseOptions.length === 0}
          >
            <option value="">Selecione um curso...</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>

          {unitOptions.length === 0 && (
            <Alert variant="warning" className="sm:col-span-2">
              <AlertDescription className="text-foreground">
                Nenhuma unidade cadastrada. Cadastre uma unidade antes de criar uma turma.
              </AlertDescription>
            </Alert>
          )}
          <Select
            label="Unidade"
            required
            value={values.unit_id}
            onChange={(event) => set('unit_id', event.target.value)}
            error={errors.unit_id}
            disabled={unitOptions.length === 0}
          >
            <option value="">Selecione uma unidade...</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            required
            value={values.status}
            onChange={(event) => set('status', event.target.value as ClassStatus)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {CLASS_STATUS_LABEL[status]}
              </option>
            ))}
          </Select>

          <Input
            label="Vagas"
            type="number"
            min={1}
            step={1}
            placeholder="Opcional"
            value={values.capacity}
            onChange={(event) => set('capacity', event.target.value)}
            error={errors.capacity}
          />

          <DatePicker
            label="Data de início"
            required
            value={values.start_date}
            onChange={(event) => set('start_date', event.target.value)}
            error={errors.start_date}
          />
          <DatePicker
            label="Data de término"
            required
            value={values.end_date}
            onChange={(event) => set('end_date', event.target.value)}
            min={values.start_date || undefined}
            error={errors.end_date}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : mode === 'create' ? 'Cadastrar turma' : 'Salvar turma'}
        </Button>
      </div>
    </form>
  )
}
