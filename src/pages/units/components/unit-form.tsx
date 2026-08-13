import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { UnitFormValues } from './unit-form-values'

interface UnitFormProps {
  mode: 'create' | 'edit'
  initialValues: UnitFormValues
  submitting: boolean
  onSubmit: (values: UnitFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<keyof UnitFormValues, string>>

export function UnitForm({ mode, initialValues, submitting, onSubmit, onCancel }: UnitFormProps) {
  const [values, setValues] = useState<UnitFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function set<K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Nome da unidade é obrigatório.'
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
          <CardTitle className="text-body">Informações da unidade</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-5 pt-5">
          <Input
            label="Nome da unidade"
            required
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            error={errors.name}
          />

          <Switch
            label="Unidade ativa"
            description="Unidades inativas não aparecem para seleção ao criar uma turma."
            checked={values.is_active}
            onCheckedChange={(checked) => set('is_active', checked)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : mode === 'create' ? 'Cadastrar unidade' : 'Salvar unidade'}
        </Button>
      </div>
    </form>
  )
}
