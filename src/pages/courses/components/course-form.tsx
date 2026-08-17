import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { CourseCategory } from '@/types/courses'
import type { CourseFormValues } from './course-form-values'

interface CourseFormProps {
  mode: 'create' | 'edit'
  initialValues: CourseFormValues
  categoryOptions: CourseCategory[]
  submitting: boolean
  onSubmit: (values: CourseFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<keyof CourseFormValues, string>>

export function CourseForm({ mode, initialValues, categoryOptions, submitting, onSubmit, onCancel }: CourseFormProps) {
  const [values, setValues] = useState<CourseFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function set<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Nome do curso é obrigatório.'
    }
    if (!values.category_id) {
      nextErrors.category_id = 'Selecione uma categoria.'
    }
    if (
      values.total_units.trim() &&
      (!Number.isInteger(Number(values.total_units)) || Number(values.total_units) <= 0)
    ) {
      nextErrors.total_units = 'Informe um número inteiro maior que zero, ou deixe em branco.'
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
          <CardTitle className="text-body">Informações do curso</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <Input
            label="Nome do curso"
            required
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            error={errors.name}
            containerClassName="sm:col-span-2"
          />

          <Select
            label="Categoria"
            required
            value={values.category_id}
            onChange={(event) => set('category_id', event.target.value)}
            error={errors.category_id}
            disabled={categoryOptions.length === 0}
            helperText={categoryOptions.length === 0 ? 'Nenhuma categoria cadastrada.' : undefined}
          >
            <option value="">Selecione uma categoria...</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            label="Quantidade de unidades (semestres)"
            type="number"
            min={1}
            step={1}
            placeholder="Opcional"
            value={values.total_units}
            onChange={(event) => set('total_units', event.target.value)}
            error={errors.total_units}
          />

          <div className="flex items-end pb-2">
            <Switch
              label="Curso ativo"
              description="Cursos inativos não aparecem para seleção ao criar uma turma."
              checked={values.is_active}
              onCheckedChange={(checked) => set('is_active', checked)}
              className="ml-auto"
            />
          </div>

          <Textarea
            label="Descrição"
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
            containerClassName="sm:col-span-2"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : mode === 'create' ? 'Cadastrar curso' : 'Salvar curso'}
        </Button>
      </div>
    </form>
  )
}
