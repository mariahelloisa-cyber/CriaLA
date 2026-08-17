import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, FileText, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatPhone, isValidEmail } from '@/utils/masks'
import type { ClassOption } from '@/types/teachers'
import type { TeacherFormValues } from './teacher-form-values'

interface TeacherFormProps {
  mode: 'create' | 'edit'
  initialValues: TeacherFormValues
  classOptions: ClassOption[]
  existingContractFileName?: string | null
  onDownloadContract?: () => void
  submitting: boolean
  onSubmit: (values: TeacherFormValues) => void | Promise<void>
  onCancel: () => void
}

type FormErrors = Partial<Record<'full_name' | 'email' | 'subject_area', string>>

export function TeacherForm({
  mode,
  initialValues,
  classOptions,
  existingContractFileName,
  onDownloadContract,
  submitting,
  onSubmit,
  onCancel,
}: TeacherFormProps) {
  const [values, setValues] = useState<TeacherFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function set<K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggleClass(classId: string, checked: boolean) {
    set('classIds', checked ? [...values.classIds, classId] : values.classIds.filter((id) => id !== classId))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!values.full_name.trim()) {
      nextErrors.full_name = 'Nome do professor é obrigatório.'
    }
    if (!values.subject_area.trim()) {
      nextErrors.subject_area = 'Área/disciplina é obrigatória.'
    }
    if (values.email.trim() && !isValidEmail(values.email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    await onSubmit(values)
  }

  const hasCurrentContract = Boolean(existingContractFileName) && !values.removeContract

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Informações do professor</CardTitle>
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

          <Input
            label="Área / disciplina"
            required
            placeholder="Ex.: Matemática, Design Gráfico..."
            value={values.subject_area}
            onChange={(event) => set('subject_area', event.target.value)}
            error={errors.subject_area}
          />

          <div className="flex items-end pb-2">
            <Switch
              label="Professor ativo"
              description="Professores inativos continuam visíveis, mas ficam marcados como inativos."
              checked={values.is_active}
              onCheckedChange={(checked) => set('is_active', checked)}
              className="ml-auto"
            />
          </div>

          <Input
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => set('email', event.target.value)}
            error={errors.email}
          />

          <Input
            label="Telefone"
            value={values.phone}
            onChange={(event) => set('phone', formatPhone(event.target.value))}
            placeholder="(00) 00000-0000"
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Contrato</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-3 pt-5">
          {hasCurrentContract && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-body-sm text-foreground">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{existingContractFileName}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {onDownloadContract && (
                  <Button type="button" variant="ghost" size="sm" onClick={onDownloadContract}>
                    <Download className="size-4" aria-hidden="true" />
                    Baixar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => set('removeContract', true)}
                >
                  <X className="size-4" aria-hidden="true" />
                  Remover
                </Button>
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="teacher-contract-file">
              {hasCurrentContract ? 'Substituir contrato' : 'Anexar contrato'}
            </Label>
            <label
              htmlFor="teacher-contract-file"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 py-2.5 text-body-sm text-muted-foreground transition-colors hover:bg-muted/40"
            >
              <Paperclip className="size-4 shrink-0" aria-hidden="true" />
              {values.contractFile ? (
                <span className="truncate text-foreground">{values.contractFile.name}</span>
              ) : (
                <span>PDF, imagem ou Word — até 10MB</span>
              )}
            </label>
            <input
              id="teacher-contract-file"
              type="file"
              accept=".pdf,.doc,.docx,image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                set('contractFile', file)
                if (file) set('removeContract', false)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">
            Turmas administradas
            <span className="ml-1.5 text-body-sm font-normal text-muted-foreground">
              ({values.classIds.length} selecionada{values.classIds.length === 1 ? '' : 's'})
            </span>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          {classOptions.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nenhuma turma cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {classOptions.map((klass) => (
                <Checkbox
                  key={klass.id}
                  label={klass.name}
                  description={klass.course?.name ?? undefined}
                  checked={values.classIds.includes(klass.id)}
                  onChange={(event) => toggleClass(klass.id, event.target.checked)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : mode === 'create' ? 'Cadastrar professor' : 'Salvar professor'}
        </Button>
      </div>
    </form>
  )
}
