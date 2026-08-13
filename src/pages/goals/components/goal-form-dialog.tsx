import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CurrencyInput } from '@/components/shared/currency-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { monthLabel } from '@/utils/period'
import type { Period } from '@/utils/period'
import type { Goal, SellerOption } from '@/types/goals'

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: SellerOption | null
  period: Period
  /** Meta já existente do vendedor neste período, se houver — pré-preenche o formulário. */
  currentGoal: Goal | null
  submitting: boolean
  onSubmit: (values: { financial_target_cents: number; student_target: number }) => void | Promise<void>
}

/**
 * Cadastro/edição mínimo de meta (financial_target/student_target por
 * vendedor+período) — decisão tomada em conjunto com o usuário no início da
 * Fase 12: o prompt da fase descreve só acompanhamento, mas sem isso o
 * dashboard do gerente nunca teria dados reais (goals estava vazia). Usa
 * exatamente as policies já existentes (goals_insert_manager/
 * goals_update_manager via upsert em goals.service.ts) — nenhuma RLS nova.
 */
export function GoalFormDialog({ open, onOpenChange, seller, period, currentGoal, submitting, onSubmit }: GoalFormDialogProps) {
  const [financialCents, setFinancialCents] = useState(0)
  const [studentTarget, setStudentTarget] = useState('0')

  useEffect(() => {
    if (open) {
      setFinancialCents(Math.round((currentGoal?.financial_target ?? 0) * 100))
      setStudentTarget(String(currentGoal?.student_target ?? 0))
    }
  }, [open, currentGoal])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      financial_target_cents: financialCents,
      student_target: Math.max(0, Number.parseInt(studentTarget, 10) || 0),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentGoal ? 'Editar meta' : 'Definir meta'} de {seller?.full_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <p className="text-body-sm text-muted-foreground">
              Período: {monthLabel(period.month)} de {period.year}
            </p>
            <CurrencyInput label="Meta financeira" required valueCents={financialCents} onChange={setFinancialCents} />
            <Input
              label="Meta de alunos"
              type="number"
              min={0}
              step={1}
              required
              value={studentTarget}
              onChange={(event) => setStudentTarget(event.target.value)}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Salvando...' : 'Salvar meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
