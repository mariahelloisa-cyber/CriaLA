import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { findStudentsByCpf } from '@/services/students.service'
import { BRAZILIAN_STATES, formatCep, formatPhone, isValidEmail } from '@/utils/masks'
import { formatCpf, isValidCpf } from '@/utils/cpf'
import type { ClassOption } from '@/types/students'
import { ClassStatusBadge } from './status-badges'
import type { StudentFormValues } from './student-form-values'

interface StudentFormProps {
  mode: 'create' | 'edit'
  initialValues: StudentFormValues
  studentId?: string
  classOptions: ClassOption[]
  /** Falso para vendedor em modo edição — PDF/RLS não concedem a ele editar matrícula. */
  canEditAcademic: boolean
  submitting: boolean
  onSubmit: (values: StudentFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<keyof StudentFormValues, string>>

export function StudentForm({
  mode,
  initialValues,
  studentId,
  classOptions,
  canEditAcademic,
  submitting,
  onSubmit,
  onCancel,
}: StudentFormProps) {
  const [values, setValues] = useState<StudentFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [cpfWarning, setCpfWarning] = useState<string | null>(null)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const selectedClass = useMemo(
    () => classOptions.find((option) => option.id === values.class_id) ?? null,
    [classOptions, values.class_id],
  )

  function set<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleCpfBlur() {
    if (!values.cpf || !isValidCpf(values.cpf)) return
    try {
      const matches = await findStudentsByCpf(values.cpf, studentId)
      setCpfWarning(
        matches.length > 0
          ? `Já existe um cadastro com este CPF: ${matches.map((match) => match.full_name).join(', ')}.`
          : null,
      )
    } catch {
      // Checagem de duplicidade é só um aviso auxiliar — falha aqui não deve travar o formulário.
      setCpfWarning(null)
    }
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!values.full_name.trim()) {
      nextErrors.full_name = 'Nome completo é obrigatório.'
    }
    if (values.cpf && !isValidCpf(values.cpf)) {
      nextErrors.cpf = 'CPF inválido.'
    }
    if (values.email && !isValidEmail(values.email)) {
      nextErrors.email = 'E-mail inválido.'
    }
    if (mode === 'create' && !values.class_id) {
      nextErrors.class_id = 'Selecione uma turma — todo aluno deve estar vinculado a uma turma.'
    }
    if (
      canEditAcademic &&
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
    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Dados pessoais</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <Input
            label="Nome completo"
            required
            value={values.full_name}
            onChange={(event) => set('full_name', event.target.value)}
            error={errors.full_name}
            containerClassName="sm:col-span-2"
          />
          <DatePicker
            label="Data de nascimento"
            value={values.birth_date}
            onChange={(event) => set('birth_date', event.target.value)}
          />
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            value={formatCpf(values.cpf)}
            onChange={(event) => set('cpf', event.target.value)}
            onBlur={handleCpfBlur}
            error={errors.cpf}
          />
          <Input label="RG" value={values.rg} onChange={(event) => set('rg', event.target.value)} />
          <Input
            label="Telefone"
            placeholder="(00) 00000-0000"
            value={formatPhone(values.phone)}
            onChange={(event) => set('phone', event.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => set('email', event.target.value)}
            error={errors.email}
          />
          <Input
            label="Nome do pai"
            value={values.father_name}
            onChange={(event) => set('father_name', event.target.value)}
          />
          <Input
            label="Nome da mãe"
            value={values.mother_name}
            onChange={(event) => set('mother_name', event.target.value)}
          />

          {cpfWarning && (
            <Alert variant="warning" className="sm:col-span-2">
              <AlertDescription className="text-foreground">{cpfWarning}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Endereço</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="CEP"
            placeholder="00000-000"
            value={formatCep(values.cep)}
            onChange={(event) => set('cep', event.target.value)}
          />
          <Input
            label="Endereço"
            value={values.address}
            onChange={(event) => set('address', event.target.value)}
            containerClassName="sm:col-span-2"
          />
          <Input label="Número" value={values.number} onChange={(event) => set('number', event.target.value)} />
          <Input
            label="Complemento"
            value={values.complement}
            onChange={(event) => set('complement', event.target.value)}
          />
          <Input
            label="Bairro"
            value={values.neighborhood}
            onChange={(event) => set('neighborhood', event.target.value)}
          />
          <Input label="Cidade" value={values.city} onChange={(event) => set('city', event.target.value)} />
          <Select label="Estado" value={values.state} onChange={(event) => set('state', event.target.value)}>
            <option value="">Selecione...</option>
            {BRAZILIAN_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Dados acadêmicos</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-5 pt-5">
          {!canEditAcademic && (
            <Alert variant="info">
              <AlertDescription className="text-foreground">
                Apenas o gerente pode alterar a turma ou as datas de matrícula/formação. Os dados abaixo são
                somente leitura.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {canEditAcademic ? (
              <Select
                label="Turma"
                required={mode === 'create'}
                value={values.class_id}
                onChange={(event) => set('class_id', event.target.value)}
                error={errors.class_id}
                helperText={
                  classOptions.length === 0 ? 'Nenhuma turma disponível para matrícula.' : undefined
                }
                disabled={classOptions.length === 0}
                containerClassName="sm:col-span-2"
              >
                <option value="">Selecione uma turma...</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} — {option.course?.name ?? 'sem curso'}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <Text variant="label">Turma</Text>
                <Text variant="body-sm">{selectedClass?.name ?? '—'}</Text>
              </div>
            )}

            {selectedClass && (
              <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-body-sm sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{selectedClass.course?.name ?? 'Curso não definido'}</span>
                  <ClassStatusBadge status={selectedClass.status} className="rounded-full" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
                  <span>Categoria: {selectedClass.course?.category?.name ?? '—'}</span>
                  <span>Unidade: {selectedClass.unit?.name ?? '—'}</span>
                </div>
              </div>
            )}

            {canEditAcademic ? (
              <DatePicker
                label="Data da matrícula"
                value={values.enrollment_date}
                onChange={(event) => set('enrollment_date', event.target.value)}
              />
            ) : (
              <div className="flex flex-col gap-1">
                <Text variant="label">Data da matrícula</Text>
                <Text variant="body-sm">{values.enrollment_date || '—'}</Text>
              </div>
            )}

            {canEditAcademic ? (
              <DatePicker
                label="Data prevista de formação"
                value={values.expected_graduation_date}
                onChange={(event) => set('expected_graduation_date', event.target.value)}
                min={values.enrollment_date || undefined}
                error={errors.expected_graduation_date}
              />
            ) : (
              <div className="flex flex-col gap-1">
                <Text variant="label">Data prevista de formação</Text>
                <Text variant="body-sm">{values.expected_graduation_date || '—'}</Text>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Cadastrar aluno' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  )
}
