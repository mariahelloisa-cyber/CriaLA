import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import { formatCpf } from '@/utils/cpf'
import { addMonthsIso, todayIso } from '@/utils/format-date'
import { splitCentsIntoInstallments } from '@/utils/currency'
import { listAvailableClassesForCourse } from '@/services/enrollments.service'
import { StudentPicker } from '@/pages/enrollments/components/student-picker'
import { ClassStatusBadge } from '@/pages/students/components/status-badges'
import type { EligibleEnrollment, InstallmentInput, PaymentMethod, SaleFormTarget } from '@/types/sales'
import type { ClassOption, Course, StudentOption } from '@/types/enrollments'
import { CurrencyInput } from '@/components/shared/currency-input'
import { PAYMENT_METHOD_LABEL } from './sale-badges'
import { EnrollmentPicker } from './enrollment-picker'
import { InstallmentPreview } from './installment-preview'
import type { SaleFormValues } from './sale-form-values'

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['cash', 'credit_card', 'bank_slip']
/**
 * O PDF/schema não definem um limite de parcelas. 12 foi escolhido por ser a
 * própria âncora usada no exemplo do PDF (seção 5: "12 parcelas de
 * R$ 100,00"), não um número arbitrário. Documentado no relatório final.
 */
const MAX_INSTALLMENTS = 12

interface SellerOption {
  id: string
  full_name: string
}

interface SaleFormProps {
  initialValues: SaleFormValues
  submitting: boolean
  onSubmit: (values: SaleFormValues, installments: InstallmentInput[], target: SaleFormTarget) => void | Promise<void>
  onCancel: () => void
  /**
   * Fase 19 (decisão 5): cursos para o modo "Nova matrícula" — só passado
   * pela página quando o modo unificado está disponível (hoje, sempre em
   * /vendas/nova, que já é manager-only por RoleRoute). Sem isso, o form
   * mostra só o modo "Matrícula existente" de sempre (comportamento
   * inalterado para quem não passar essa prop).
   */
  courseOptions?: Course[]
  /**
   * Vendedores para o seletor opcional "Vendedor" — /vendas/nova é
   * manager-only por RoleRoute, então este campo é sempre exibido (sem
   * checagem extra de role aqui).
   */
  sellerOptions: SellerOption[]
}

type FormErrors = Partial<Record<keyof SaleFormValues, string>> & {
  student_id?: string
  course_id?: string
  class_id?: string
  enrollment_date?: string
}

export function SaleForm({ initialValues, submitting, onSubmit, onCancel, courseOptions, sellerOptions }: SaleFormProps) {
  const [values, setValues] = useState<SaleFormValues>(initialValues)
  const [enrollment, setEnrollment] = useState<EligibleEnrollment | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  // Fase 19, decisão 5: "existing" = comportamento original (anexar venda a
  // uma matrícula já criada sem venda). "new" = fluxo unificado (matrícula +
  // venda no mesmo processo, para um aluno já cadastrado). O toggle só
  // aparece quando `courseOptions` é passado pela página.
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [newStudent, setNewStudent] = useState<StudentOption | null>(null)
  const [newCourseId, setNewCourseId] = useState('')
  const [newClassId, setNewClassId] = useState('')
  const [newEnrollmentDate, setNewEnrollmentDate] = useState(todayIso())
  const [newExpectedGraduationDate, setNewExpectedGraduationDate] = useState('')
  const [newClassOptions, setNewClassOptions] = useState<ClassOption[]>([])
  const [loadingNewClasses, setLoadingNewClasses] = useState(false)

  useEffect(() => {
    if (!newCourseId) {
      setNewClassOptions([])
      return
    }
    let active = true
    setLoadingNewClasses(true)
    listAvailableClassesForCourse(newCourseId)
      .then((data) => {
        if (active) setNewClassOptions(data)
      })
      .catch(() => {
        if (active) setNewClassOptions([])
      })
      .finally(() => {
        if (active) setLoadingNewClasses(false)
      })
    return () => {
      active = false
    }
  }, [newCourseId])

  const selectedNewClass = useMemo(
    () => newClassOptions.find((option) => option.id === newClassId) ?? null,
    [newClassOptions, newClassId],
  )

  function set<K extends keyof SaleFormValues>(key: K, value: SaleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handlePaymentMethodChange(method: PaymentMethod) {
    setValues((prev) => ({
      ...prev,
      payment_method: method,
      // À vista sempre é 1x (seção 9 do prompt: "Se pagamento à vista: Quantidade de parcelas = 1").
      installment_count: method === 'cash' ? 1 : prev.installment_count,
    }))
  }

  const installmentRows = useMemo(() => {
    if (values.total_amount_cents <= 0) return []
    const amounts = splitCentsIntoInstallments(values.total_amount_cents, values.installment_count)
    return amounts.map((amountCents, index) => ({
      installment_number: index + 1,
      amountCents,
      // Vencimento mensal a partir da data da venda — o PDF não define regra
      // de vencimento; esta é a implementação conservadora adotada (ver
      // utils/format-date.ts:addMonthsIso e relatório final da Fase 11).
      due_date: values.sale_date ? addMonthsIso(values.sale_date, index) : '',
    }))
  }, [values.total_amount_cents, values.installment_count, values.sale_date])

  function validate(): boolean {
    const nextErrors: FormErrors = {}
    if (mode === 'existing') {
      if (!enrollment) nextErrors.enrollment_id = 'Selecione uma matrícula.'
    } else {
      if (!newStudent) nextErrors.student_id = 'Selecione um aluno.'
      if (!newCourseId) nextErrors.course_id = 'Selecione um curso.'
      if (!newClassId) nextErrors.class_id = 'Selecione uma turma.'
      if (!newEnrollmentDate) nextErrors.enrollment_date = 'Data da matrícula é obrigatória.'
    }
    if (values.total_amount_cents <= 0) nextErrors.total_amount_cents = 'Informe um valor maior que zero.'
    if (!values.sale_date) nextErrors.sale_date = 'Data da venda é obrigatória.'
    if (values.installment_count < 1 || values.installment_count > MAX_INSTALLMENTS) {
      nextErrors.installment_count = `Quantidade de parcelas deve ser entre 1 e ${MAX_INSTALLMENTS}.`
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    if (mode === 'existing' && !enrollment) return
    if (mode === 'new' && (!newStudent || !newCourseId || !newClassId)) return

    const installments: InstallmentInput[] = installmentRows.map((row) => ({
      installment_number: row.installment_number,
      amount: row.amountCents / 100,
      due_date: row.due_date || null,
    }))

    const target: SaleFormTarget =
      mode === 'existing'
        ? { mode: 'existing', enrollmentId: enrollment!.id }
        : {
            mode: 'new',
            studentId: newStudent!.id,
            classId: newClassId,
            enrollmentDate: newEnrollmentDate,
            expectedGraduationDate: newExpectedGraduationDate || null,
          }

    await onSubmit(values, installments, target)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Matrícula</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-4 pt-5">
          {courseOptions && (
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'existing' | 'new')}>
              <TabsList>
                <TabsTrigger value="existing">Matrícula existente sem venda</TabsTrigger>
                <TabsTrigger value="new">Nova matrícula</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === 'new' && courseOptions ? (
            <div className="flex flex-col gap-4">
              <StudentPicker value={newStudent} onChange={setNewStudent} error={errors.student_id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Curso"
                  required
                  value={newCourseId}
                  onChange={(event) => {
                    setNewCourseId(event.target.value)
                    setNewClassId('')
                    if (errors.course_id) setErrors((prev) => ({ ...prev, course_id: undefined }))
                  }}
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
                  value={newClassId}
                  onChange={(event) => {
                    setNewClassId(event.target.value)
                    if (errors.class_id) setErrors((prev) => ({ ...prev, class_id: undefined }))
                  }}
                  error={errors.class_id}
                  disabled={!newCourseId || loadingNewClasses || newClassOptions.length === 0}
                  helperText={
                    !newCourseId
                      ? 'Selecione um curso primeiro.'
                      : !loadingNewClasses && newClassOptions.length === 0
                        ? 'Nenhuma turma disponível para este curso.'
                        : undefined
                  }
                >
                  <option value="">{loadingNewClasses ? 'Carregando...' : 'Selecione uma turma...'}</option>
                  {newClassOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </Select>

                <DatePicker
                  label="Data da matrícula"
                  required
                  value={newEnrollmentDate}
                  onChange={(event) => {
                    setNewEnrollmentDate(event.target.value)
                    if (errors.enrollment_date) setErrors((prev) => ({ ...prev, enrollment_date: undefined }))
                  }}
                  error={errors.enrollment_date}
                />
                <DatePicker
                  label="Data prevista de formação"
                  value={newExpectedGraduationDate}
                  onChange={(event) => setNewExpectedGraduationDate(event.target.value)}
                  min={newEnrollmentDate || undefined}
                />
              </div>

              {selectedNewClass && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-body-sm">
                  <span className="font-medium text-foreground">Unidade: {selectedNewClass.unit?.name ?? '—'}</span>
                  <ClassStatusBadge status={selectedNewClass.status} className="rounded-full" />
                </div>
              )}
            </div>
          ) : (
            <EnrollmentPicker value={enrollment} onChange={setEnrollment} error={errors.enrollment_id} />
          )}

          {mode === 'existing' && enrollment && (
            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-3 sm:grid-cols-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Aluno</span>
                <span className="text-body-sm text-foreground">{enrollment.student.full_name}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">CPF</span>
                <span className="text-body-sm text-foreground">
                  {enrollment.student.cpf ? formatCpf(enrollment.student.cpf) : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Curso</span>
                <span className="text-body-sm text-foreground">{enrollment.class?.course?.name ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Turma</span>
                <span className="text-body-sm text-foreground">{enrollment.class?.name ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">Unidade</span>
                <span className="text-body-sm text-foreground">{enrollment.class?.unit?.name ?? '—'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-body">Dados comerciais</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
          <Select
            label="Vendedor"
            value={values.seller_id}
            onChange={(event) => set('seller_id', event.target.value)}
            helperText="Opcional — deixe em branco para manter o vendedor do aluno."
            containerClassName="sm:col-span-2"
          >
            <option value="">Vendedor do aluno (padrão)</option>
            {sellerOptions.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name}
              </option>
            ))}
          </Select>

          <CurrencyInput
            label="Valor da venda"
            required
            valueCents={values.total_amount_cents}
            onChange={(cents) => set('total_amount_cents', cents)}
            error={errors.total_amount_cents}
          />

          <Select
            label="Forma de pagamento"
            required
            value={values.payment_method}
            onChange={(event) => handlePaymentMethodChange(event.target.value as PaymentMethod)}
          >
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABEL[method]}
              </option>
            ))}
          </Select>

          <DatePicker
            label="Data da venda"
            required
            value={values.sale_date}
            onChange={(event) => set('sale_date', event.target.value)}
            error={errors.sale_date}
          />

          <Select
            label="Quantidade de parcelas"
            required
            value={String(values.installment_count)}
            onChange={(event) => set('installment_count', Number(event.target.value))}
            disabled={values.payment_method === 'cash'}
            helperText={values.payment_method === 'cash' ? 'Pagamento à vista é sempre em 1x.' : undefined}
            error={errors.installment_count}
          >
            {Array.from({ length: MAX_INSTALLMENTS }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}x
              </option>
            ))}
          </Select>

          <Input
            label="Observação sobre o plano de pagamento"
            containerClassName="sm:col-span-2"
            placeholder="Opcional — ex.: 3x no cartão, sem juros"
            value={values.payment_plan}
            onChange={(event) => set('payment_plan', event.target.value)}
          />
        </CardContent>
      </Card>

      {installmentRows.length > 0 && (
        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-body">Parcelas</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-col gap-3 pt-5">
            <Text variant="caption" className="text-muted-foreground">
              Vencimento mensal a partir da data da venda. A soma das parcelas é sempre igual ao valor total (sem
              perda de centavos por arredondamento).
            </Text>
            <InstallmentPreview rows={installmentRows} />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : 'Registrar venda'}
        </Button>
      </div>
    </form>
  )
}
